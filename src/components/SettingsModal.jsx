import React, { useState } from 'react';
import { X, HelpCircle, ShieldCheck, CheckCircle2, Database, Key } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const isClientIdLoaded = !!import.meta.env.VITE_GDRIVE_CLIENT_ID;
  const isApiKeyLoaded = !!import.meta.env.VITE_GDRIVE_API_KEY;
  const hasToken = !!localStorage.getItem('gdrive_token');
  const workspaceFolderId = localStorage.getItem('gdrive_workspace_folder_id') || 'Automatic';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        style={{ maxWidth: '580px', width: '100%', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="btn-icon" 
          style={{ position: 'absolute', top: '20px', right: '20px' }} 
          onClick={onClose}
          aria-label="Close settings"
        >
          <X size={18} />
        </button>
        
        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          System Configuration
        </h3>

        {/* Security & Credentials Status Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Secure Credentials Status</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Client ID Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Key size={14} />
                <span>Google Client ID</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: isClientIdLoaded ? '#00e676' : '#ff3366' }} />
                <span style={{ 
                  color: isClientIdLoaded ? '#00e676' : '#ff3366',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}>
                  {isClientIdLoaded ? 'Loaded in Background' : 'Missing'}
                </span>
              </div>
            </div>

            {/* API Key Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Key size={14} />
                <span>Google API Key</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} style={{ color: isApiKeyLoaded ? '#00e676' : '#ff3366' }} />
                <span style={{ 
                  color: isApiKeyLoaded ? '#00e676' : '#ff3366',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}>
                  {isApiKeyLoaded ? 'Loaded in Background' : 'Missing'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            fontSize: '0.8rem',
            lineHeight: '1.4',
            color: 'var(--text-muted)'
          }}>
            <strong>Secure Environment Mode:</strong> API credentials are loaded dynamically from background environment configuration. They are hidden from settings UI and local storage to prevent retrieval by third-party scripts.
          </div>
        </div>

        {/* Workspace Connection Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Database size={20} style={{ color: 'var(--accent-primary)' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Workspace Connection</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Directory:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>DriveIDE_Workspace</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Folder ID:</span>
              <span style={{ 
                color: 'var(--text-muted)', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.8rem',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={workspaceFolderId}>
                {workspaceFolderId}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auth Token Status:</span>
              <span style={{ color: hasToken ? '#00e676' : '#ffab00', fontWeight: 500 }}>
                {hasToken ? 'Authenticated' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle size={14} /> {showHelp ? 'Hide Developer Guide' : 'Developer Guide'}
          </button>
          
          <button className="btn-primary" style={{ padding: '6px 20px', fontSize: '0.9rem' }} onClick={onClose}>
            Done
          </button>
        </div>

        {showHelp && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            borderRadius: '8px', 
            background: 'rgba(0, 240, 255, 0.05)', 
            border: '1px solid rgba(0, 240, 255, 0.15)',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            color: 'var(--text-muted)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Configuring Environment Credentials:</p>
            <p style={{ marginBottom: '8px' }}>For local development, copy <code>.env.example</code> to <code>.env.local</code> and fill in your keys:</p>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '8px', 
              borderRadius: '4px', 
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              marginBottom: '12px',
              overflowX: 'auto'
            }}>
{`VITE_GDRIVE_CLIENT_ID=your-google-oauth-client-id
VITE_GDRIVE_API_KEY=your-google-api-key`}
            </pre>
            <p>For hosting environments (like Vercel or Netlify), add these keys as environment variables in your hosting dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
