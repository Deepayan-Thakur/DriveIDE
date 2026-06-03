import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FolderIcon, 
  LogOut, 
  RefreshCw, 
  FilePlus, 
  FolderPlus, 
  FileCode, 
  Info,
  Loader,
  Save
} from 'lucide-react';
import { 
  getOrCreateWorkspaceFolder, 
  getWorkspaceTree, 
  getFileContent, 
  saveFileContent, 
  createFile, 
  createFolder, 
  deleteItem, 
  renameItem,
  signOut
} from '../services/googleDriveService';
import FileTreeItem from './FileTreeItem';
import RunnerPanel from './RunnerPanel';
export default function EditorPage({ onLogout }) {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceTree, setWorkspaceTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFiles, setOpenFiles] = useState([]); // Array of file items
  const [activeFile, setActiveFile] = useState(null); // Active file item
  const [fileContents, setFileContents] = useState({}); // { [fileId]: content }
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved', 'unsaved', 'saving'
  const [refreshing, setRefreshing] = useState(false);

  const autoSaveTimerRef = useRef({});

  // 1. Initial Load: Get or create the workspace folder in GDrive
  useEffect(() => {
    async function initWorkspace() {
      try {
        setLoading(true);
        const folderId = await getOrCreateWorkspaceFolder();
        setWorkspaceId(folderId);
        await loadWorkspaceContents(folderId);
      } catch (err) {
        console.error('Error loading workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    initWorkspace();
  }, []);

  // 2. Fetch workspace items recursively
  const loadWorkspaceContents = async (id = workspaceId) => {
    if (!id) return;
    setRefreshing(true);
    try {
      const tree = await getWorkspaceTree(id);
      setWorkspaceTree(tree);
    } catch (err) {
      console.error('Failed to load file tree:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // 3. Open a file in the editor (fetching content if not in cache)
  const handleOpenFile = async (fileItem) => {
    // Add to open files tab list if not present
    if (!openFiles.find(f => f.id === fileItem.id)) {
      setOpenFiles(prev => [...prev, fileItem]);
    }
    
    setActiveFile(fileItem);
    
    // Fetch file content if not already cached
    if (fileContents[fileItem.id] === undefined) {
      try {
        setSavingStatus('saving');
        const content = await getFileContent(fileItem.id);
        setFileContents(prev => ({ ...prev, [fileItem.id]: content }));
        setSavingStatus('saved');
      } catch (err) {
        console.error('Failed to get file content:', err);
        setSavingStatus('error');
      }
    }
  };

  const handleCloseFile = (fileId, e) => {
    e.stopPropagation();
    
    const index = openFiles.findIndex(f => f.id === fileId);
    if (index === -1) return;
    
    // Clear auto-save timer if any
    if (autoSaveTimerRef.current[fileId]) {
      clearTimeout(autoSaveTimerRef.current[fileId]);
      delete autoSaveTimerRef.current[fileId];
    }

    const nextOpenFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(nextOpenFiles);
    
    // If closing active file, switch to another tab
    if (activeFile?.id === fileId) {
      if (nextOpenFiles.length > 0) {
        // Switch to adjacent tab
        const nextActive = nextOpenFiles[Math.min(index, nextOpenFiles.length - 1)];
        setActiveFile(nextActive);
      } else {
        setActiveFile(null);
      }
    }
  };

  // 4. Editor Content Updates & Debounced Auto-save
  const handleEditorChange = (value) => {
    if (!activeFile) return;
    
    setSavingStatus('unsaved');
    setFileContents(prev => ({ ...prev, [activeFile.id]: value }));

    // Cancel existing timer for this file
    if (autoSaveTimerRef.current[activeFile.id]) {
      clearTimeout(autoSaveTimerRef.current[activeFile.id]);
    }

    // Trigger debounced save to Google Drive (1500ms)
    autoSaveTimerRef.current[activeFile.id] = setTimeout(async () => {
      setSavingStatus('saving');
      try {
        await saveFileContent(activeFile.id, value);
        setSavingStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSavingStatus('error');
      }
    }, 1500);
  };

  // Manual save trigger (Ctrl+S support)
  const triggerManualSave = async () => {
    if (!activeFile || savingStatus === 'saving') return;
    
    // Cancel debounce timer
    if (autoSaveTimerRef.current[activeFile.id]) {
      clearTimeout(autoSaveTimerRef.current[activeFile.id]);
    }

    setSavingStatus('saving');
    try {
      const content = fileContents[activeFile.id] || '';
      await saveFileContent(activeFile.id, content);
      setSavingStatus('saved');
    } catch (err) {
      console.error('Manual save error:', err);
      setSavingStatus('error');
    }
  };

  // Handle Ctrl+S key shortcut inside window
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        triggerManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, fileContents]);

  // 5. File System Operations
  const handleCreateRootFile = async () => {
    const name = prompt('Enter file name:');
    if (!name || !name.trim()) return;
    try {
      const newFile = await createFile(workspaceId, name.trim());
      await loadWorkspaceContents();
      handleOpenFile(newFile);
    } catch (err) {
      alert(`Error creating file: ${err.message}`);
    }
  };

  const handleCreateRootFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;
    try {
      await createFolder(workspaceId, name.trim());
      await loadWorkspaceContents();
    } catch (err) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleAddFile = async (parentId, name) => {
    try {
      const newFile = await createFile(parentId, name);
      await loadWorkspaceContents();
      handleOpenFile(newFile);
    } catch (err) {
      alert(`Error creating file: ${err.message}`);
    }
  };

  const handleAddFolder = async (parentId, name) => {
    try {
      await createFolder(parentId, name);
      await loadWorkspaceContents();
    } catch (err) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleRename = async (itemId, newName) => {
    try {
      await renameItem(itemId, newName);
      // Update open tab names if active
      setOpenFiles(prev => prev.map(f => f.id === itemId ? { ...f, name: newName } : f));
      if (activeFile?.id === itemId) {
        setActiveFile(prev => ({ ...prev, name: newName }));
      }
      await loadWorkspaceContents();
    } catch (err) {
      alert(`Error renaming item: ${err.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteItem(itemId);
      // Close file tab if open
      setOpenFiles(prev => prev.filter(f => f.id !== itemId));
      if (activeFile?.id === itemId) {
        setActiveFile(null);
      }
      await loadWorkspaceContents();
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const handleGetFileContent = async (id) => {
    if (fileContents[id] !== undefined) {
      return fileContents[id];
    }
    return await getFileContent(id);
  };

  const handleLogout = () => {
    signOut(onLogout);
  };

  // Helper to resolve languages for Monaco
  const getLanguageFromFilename = (fileName) => {
    if (!fileName) return 'plaintext';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.py')) return 'python';
    return 'plaintext';
  };

  if (loading) {
    return (
      <div className="ide-empty-state" style={{ height: '100vh', gap: '16px' }}>
        <Loader size={48} className="animated-spin" style={{ color: 'var(--accent-cyan)' }} />
        <div>Connecting workspace folders to Google Drive...</div>
      </div>
    );
  }

  return (
    <div className="ide-container">
      {/* Top Bar */}
      <div className="ide-topbar">
        <div className="ide-logo">
          <FileCode size={18} style={{ color: 'var(--accent-cyan)' }} />
          DriveIDE
        </div>
        
        {activeFile && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Workspace / <span style={{ color: 'var(--text-main)' }}>{activeFile.name}</span>
          </div>
        )}

        <div className="ide-status">
          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '12px' }}>
            <div className={`status-dot ${savingStatus === 'saved' ? 'connected' : ''}`} 
              style={{
                backgroundColor: 
                  savingStatus === 'saving' ? '#ffeb3b' : 
                  savingStatus === 'unsaved' ? '#ff9800' : 
                  savingStatus === 'error' ? '#f44336' : '#00e676',
                boxShadow: 
                  savingStatus === 'saving' ? '0 0 8px #ffeb3b' : 
                  savingStatus === 'unsaved' ? '0 0 8px #ff9800' : 
                  savingStatus === 'error' ? '0 0 8px #f44336' : '0 0 8px #00e676'
              }}
            />
            <span className="status-text">
              {savingStatus === 'saved' && 'Synced'}
              {savingStatus === 'unsaved' && 'Unsaved Changes'}
              {savingStatus === 'saving' && 'Saving...'}
              {savingStatus === 'error' && 'Sync Error'}
            </span>
          </div>

          <button className="btn-icon" title="Save File (Ctrl+S)" onClick={triggerManualSave}>
            <Save size={16} />
          </button>

          <button className="btn-icon" title="Disconnect Drive" onClick={handleLogout} style={{ color: '#ff3366' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="ide-body">
        {/* Sidebar */}
        <div className="ide-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Explorer</span>
            <div className="sidebar-actions">
              <button className="btn-icon" style={{ width: 24, height: 24 }} title="New File" onClick={handleCreateRootFile}>
                <FilePlus size={14} />
              </button>
              <button className="btn-icon" style={{ width: 24, height: 24 }} title="New Folder" onClick={handleCreateRootFolder}>
                <FolderPlus size={14} />
              </button>
              <button 
                className="btn-icon" 
                style={{ width: 24, height: 24 }} 
                title="Refresh Files" 
                onClick={() => loadWorkspaceContents()}
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? 'animated-spin' : ''} />
              </button>
            </div>
          </div>
          
          <div className="sidebar-content">
            {workspaceTree.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px', textAlign: 'center' }}>
                No files in workspace. Click icons above to create one.
              </div>
            ) : (
              workspaceTree.map((item) => (
                <FileTreeItem
                  key={item.id}
                  item={item}
                  depth={0}
                  activeFileId={activeFile?.id}
                  onFileClick={handleOpenFile}
                  onAddFile={handleAddFile}
                  onAddFolder={handleAddFolder}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* Editor & Console workspace */}
        <div className="ide-workspace">
          {/* Tabs */}
          {openFiles.length > 0 ? (
            <>
              <div className="editor-tabs">
                {openFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className={`editor-tab ${activeFile?.id === file.id ? 'active' : ''}`}
                    onClick={() => setActiveFile(file)}
                  >
                    <span>{file.name}</span>
                    <span className="editor-tab-close" onClick={(e) => handleCloseFile(file.id, e)}>×</span>
                  </div>
                ))}
              </div>

              {/* Monaco Editor */}
              <div className="editor-container">
                {activeFile && fileContents[activeFile.id] !== undefined ? (
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={getLanguageFromFilename(activeFile.name)}
                    value={fileContents[activeFile.id]}
                    onChange={handleEditorChange}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      automaticLayout: true,
                      wordWrap: 'on',
                      tabSize: 2,
                    }}
                  />
                ) : (
                  <div className="ide-empty-state">
                    <Loader size={24} className="animated-spin" style={{ color: 'var(--accent-cyan)' }} />
                    <div style={{ marginTop: '12px' }}>Loading file contents...</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ide-empty-state" style={{ flex: 1 }}>
              <div className="empty-title">Welcome to DriveIDE</div>
              <div className="empty-desc">
                Select a file from the explorer sidebar or create a new file to start editing.
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={handleCreateRootFile}>
                  <FilePlus size={16} /> New File
                </button>
                <button className="btn-secondary" onClick={handleCreateRootFolder}>
                  <FolderPlus size={16} /> New Folder
                </button>
              </div>
            </div>
          )}

          {/* Code runner & preview terminal */}
          <RunnerPanel 
            activeFile={activeFile} 
            workspaceTree={workspaceTree}
            onGetFileContent={handleGetFileContent}
          />
        </div>
      </div>
    </div>
  );
}
