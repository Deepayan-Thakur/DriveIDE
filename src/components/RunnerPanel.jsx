import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Monitor, Terminal, Loader } from 'lucide-react';
import { getFileContent } from '../services/googleDriveService';

export default function RunnerPanel({ activeFile, workspaceTree, onGetFileContent }) {
  const [activeTab, setActiveTab] = useState('console'); // 'console' or 'preview'
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pyodideLoading, setPyodideLoading] = useState(false);
  
  const pyodideRef = useRef(null);
  const iframeRef = useRef(null);

  const addLog = (message, type = 'log') => {
    setLogs((prev) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Listen for logs sent from the preview iframe
  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'IFRAME_LOG':
            addLog(event.data.message, 'log');
            break;
          case 'IFRAME_WARN':
            addLog(event.data.message, 'warning');
            break;
          case 'IFRAME_ERROR':
            addLog(event.data.message, 'error');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Recursively find a file in the workspace tree by name
  const findFileByName = (tree, name) => {
    for (const item of tree) {
      if (!item.isFolder && item.name === name) {
        return item;
      }
      if (item.isFolder && item.children) {
        const found = findFileByName(item.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  // Compile full HTML doc by resolving relative script & style tags from workspace
  const buildWebPreview = async (htmlCode) => {
    addLog('Building preview...', 'info');
    
    // Create DOM parser to process tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    
    // 1. Resolve stylesheet link tags
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    for (const link of linkTags) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('//')) {
        const fileItem = findFileByName(workspaceTree, href);
        if (fileItem) {
          try {
            const cssContent = await onGetFileContent(fileItem.id);
            const styleTag = doc.createElement('style');
            styleTag.textContent = cssContent;
            link.parentNode.replaceChild(styleTag, link);
          } catch (e) {
            addLog(`Error loading linked stylesheet "${href}": ${e.message}`, 'warning');
          }
        }
      }
    }

    // 2. Resolve script tags
    const scriptTags = doc.querySelectorAll('script[src]');
    for (const script of scriptTags) {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        const fileItem = findFileByName(workspaceTree, src);
        if (fileItem) {
          try {
            const jsContent = await onGetFileContent(fileItem.id);
            const inlineScript = doc.createElement('script');
            inlineScript.textContent = jsContent;
            script.parentNode.replaceChild(inlineScript, script);
          } catch (e) {
            addLog(`Error loading linked script "${src}": ${e.message}`, 'warning');
          }
        }
      }
    }

    // 3. Inject console interceptor script
    const consoleInterceptor = doc.createElement('script');
    consoleInterceptor.textContent = `
      (function() {
        const wrapLog = (type) => (...args) => {
          window.parent.postMessage({
            type: 'IFRAME_' + type.toUpperCase(),
            message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
          }, '*');
        };
        console.log = wrapLog('log');
        console.warn = wrapLog('warn');
        console.error = wrapLog('error');
        window.addEventListener('error', (e) => {
          window.parent.postMessage({
            type: 'IFRAME_ERROR',
            message: e.message + ' (line ' + e.lineno + ')'
          }, '*');
        });
      })();
    `;
    doc.head.insertBefore(consoleInterceptor, doc.head.firstChild);

    const serializedHtml = new XMLSerializer().serializeToString(doc);
    const blob = new Blob([serializedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    setPreviewUrl(url);
    setActiveTab('preview');
    addLog('Preview built successfully!', 'success');
  };

  // Run python code client-side via Pyodide Wasm
  const runPython = async (code) => {
    setIsRunning(true);
    addLog('Initializing Python environment...', 'info');

    try {
      if (!pyodideRef.current) {
        setPyodideLoading(true);
        // Load external Pyodide script dynamically if not loaded
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const pyodideInstance = await window.loadPyodide();
        
        // Patch input() using window.prompt() synchronously
        await pyodideInstance.runPythonAsync(`
          import builtins
          import js
          def custom_input(prompt=""):
              val = js.prompt(prompt)
              if val is None:
                  raise KeyboardInterrupt("Input prompt cancelled")
              return val
          builtins.input = custom_input
        `);
        
        pyodideRef.current = pyodideInstance;
        setPyodideLoading(false);
      }

      // Configure stdout/stderr redirection
      pyodideRef.current.setStdout({
        batched: (text) => addLog(text, 'log'),
      });
      pyodideRef.current.setStderr({
        batched: (text) => addLog(text, 'error'),
      });

      addLog('Running Python...', 'info');
      await pyodideRef.current.runPythonAsync(code);
      addLog('Python process completed.', 'success');
    } catch (err) {
      addLog(err.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Run javascript directly in browser console
  const runJS = (code) => {
    setIsRunning(true);
    addLog('Running JavaScript...', 'info');
    
    // Redirect console temporary
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => addLog(args.join(' '), 'log');
    console.error = (...args) => addLog(args.join(' '), 'error');

    try {
      // Run javascript in standard global context
      const result = window.eval(code);
      if (result !== undefined) {
        addLog(`=> ${result}`, 'success');
      } else {
        addLog('Execution completed.', 'success');
      }
    } catch (err) {
      addLog(err.message, 'error');
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeFile) return;
    
    try {
      const content = await onGetFileContent(activeFile.id);
      
      if (activeFile.name.endsWith('.py')) {
        setActiveTab('console');
        runPython(content);
      } else if (activeFile.name.endsWith('.js')) {
        setActiveTab('console');
        runJS(content);
      } else if (activeFile.name.endsWith('.html')) {
        buildWebPreview(content);
      } else {
        addLog(`Cannot run file "${activeFile.name}". Supported types: .js, .py, .html`, 'warning');
      }
    } catch (e) {
      addLog(`Failed to load file content: ${e.message}`, 'error');
    }
  };

  const isExecutable = activeFile && (
    activeFile.name.endsWith('.py') || 
    activeFile.name.endsWith('.js') || 
    activeFile.name.endsWith('.html')
  );

  return (
    <div className="bottom-panel">
      {/* Tab bar header */}
      <div className="bottom-panel-header">
        <div className="bottom-panel-tabs">
          <button 
            className={`bottom-panel-tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            <Terminal size={14} style={{ marginRight: 6 }} /> Console Output
          </button>
          {activeFile?.name?.endsWith('.html') && (
            <button 
              className={`bottom-panel-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Monitor size={14} style={{ marginRight: 6 }} /> Live Preview
            </button>
          )}
        </div>

        {/* Toolbar actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {pyodideLoading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader size={12} className="animated-spin" /> Loading Pyodide...
            </span>
          )}
          {isExecutable && (
            <button 
              className="btn-primary" 
              style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <Play size={12} fill="currentColor" /> {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
          <button 
            className="btn-icon" 
            style={{ width: 24, height: 24 }}
            onClick={clearLogs}
            title="Clear Console"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="bottom-panel-content">
        {activeTab === 'console' ? (
          <div className="console-log-list">
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                Console is empty. Click "Run" to execute scripts.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`console-log ${log.type}`}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            {previewUrl ? (
              <iframe 
                ref={iframeRef} 
                src={previewUrl} 
                className="preview-frame"
                title="Web Preview Sandbox"
                sandbox="allow-scripts"
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                No active preview. Run an HTML file to compile preview.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
