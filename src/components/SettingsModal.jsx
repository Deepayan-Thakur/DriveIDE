import React, { useState } from 'react';
import { X, HelpCircle, Key, FileCode } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [clientId, setClientId] = useState(localStorage.getItem('gdrive_client_id') || import.meta.env.VITE_GDRIVE_CLIENT_ID || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gdrive_api_key') || import.meta.env.VITE_GDRIVE_API_KEY || '');
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('gdrive_client_id', clientId.trim());
    localStorage.setItem('gdrive_api_key', apiKey.trim());
    onSave({ clientId: clientId.trim(), apiKey: apiKey.trim() });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <button className="btn-icon" style={{ position: 'absolute', top: '20px', right: '20px' }} onClick={onClose}>
          <X size={18} />
        </button>
        
        <h3 className="modal-title">Configure Credentials</h3>
        
        <div className="form-group">
          <label className="form-label">Google Client ID</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Google API Key</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle size={14} /> {showHelp ? 'Hide Instructions' : 'How do I get these?'}
          </button>
        </div>

        {showHelp && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            borderRadius: '8px', 
            background: 'rgba(0, 240, 255, 0.05)', 
            border: '1px solid rgba(0, 240, 255, 0.15)',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Steps to setup credentials:</p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>Google Cloud Console</a>.</li>
              <li>Create a new project or select an existing one.</li>
              <li>Search for and enable the <strong>Google Drive API</strong>.</li>
              <li>Configure the <strong>OAuth consent screen</strong> as an "External" app and add your email as test user.</li>
              <li>Under <strong>Credentials</strong>, click "Create Credentials" and choose <strong>API Key</strong>. Copy it.</li>
              <li>Click "Create Credentials" again and choose <strong>OAuth client ID</strong>. Select <strong>Web application</strong>.</li>
              <li>Add <code>http://localhost:5173</code> (and your deployed domain, if any) to:
                <ul style={{ paddingLeft: '15px', marginTop: '4px' }}>
                  <li>Authorized JavaScript origins</li>
                  <li>Authorized redirect URIs</li>
                </ul>
              </li>
              <li>Copy the generated <strong>Client ID</strong> and save both credentials above!</li>
            </ol>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save & Reload</button>
        </div>
      </div>
    </div>
  );
}
