import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderGit, Settings, Play, Database, ShieldAlert, Cpu } from 'lucide-react';
import SettingsModal from './SettingsModal';

export default function LandingPage({ isAuthed, onStart, onAuthRequest }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const hasCredentials = !!(
    (localStorage.getItem('gdrive_client_id') || import.meta.env.VITE_GDRIVE_CLIENT_ID) &&
    (localStorage.getItem('gdrive_api_key') || import.meta.env.VITE_GDRIVE_API_KEY)
  );

  const handleStartCoding = () => {
    if (!hasCredentials) {
      setIsSettingsOpen(true);
    } else {
      if (isAuthed) {
        onStart();
      } else {
        onAuthRequest();
      }
    }
  };

  const handleCredentialsSaved = () => {
    // Notify app that credentials updated
    window.location.reload();
  };

  return (
    <div className="landing-container">
      {/* Background Gradients */}
      <div className="glow-bg">
        <div className="glow-orb-1"></div>
        <div className="glow-orb-2"></div>
        <div className="glow-orb-center"></div>
      </div>

      {/* Landing Header */}
      <header className="landing-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="landing-logo">DriveIDE</h1>
        </motion.div>
        
        <motion.p 
          className="landing-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          A premium, client-side developer workspace powered by the VS Code editor engine,
          saving files directly in your Google Drive with absolute privacy.
        </motion.p>
      </header>

      {/* Call to Action Buttons */}
      <motion.div 
        style={{ display: 'flex', gap: '16px', marginBottom: '4rem' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
      >
        <button className="btn-primary" onClick={handleStartCoding}>
          <Play size={18} fill="currentColor" />
          {isAuthed ? 'Open Editor' : hasCredentials ? 'Authorize Google Drive' : 'Setup Drive Connection'}
        </button>
        <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
          <Settings size={18} />
          Configure API
        </button>
      </motion.div>

      {/* Credentials Alert if missing */}
      {!hasCredentials && (
        <motion.div 
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 24px', 
            marginBottom: '3rem', 
            border: '1px solid rgba(255, 171, 0, 0.2)',
            backgroundColor: 'rgba(255, 171, 0, 0.05)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ShieldAlert size={20} style={{ color: '#ffab00' }} />
          <span style={{ fontSize: '0.9rem', color: '#ffd166' }}>
            Setup Google API Credentials in the top right Configuration before connecting.
          </span>
        </motion.div>
      )}

      {/* Grid of Key Features */}
      <motion.div 
        className="landing-features"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="glass-card">
          <div className="feature-title">
            <Database size={24} style={{ color: 'var(--accent-cyan)' }} />
            <span>Google Drive Storage</span>
          </div>
          <p className="feature-description">
            Your projects reside in your personal cloud. Files automatically sync directly to your GDrive. No server setups, no data mining.
          </p>
        </div>

        <div className="glass-card">
          <div className="feature-title">
            <Cpu size={24} style={{ color: '#00e676' }} />
            <span>Monaco Editor Core</span>
          </div>
          <p className="feature-description">
            Edit with IntelliSense, multiple cursors, auto-bracket completion, and themes powered by the identical core backend as VS Code.
          </p>
        </div>

        <div className="glass-card">
          <div className="feature-title">
            <FolderGit size={24} style={{ color: 'var(--accent-primary)' }} />
            <span>Live Workspace Running</span>
          </div>
          <p className="feature-description">
            Run Javascript or preview HTML/CSS pages live in a preview box. Compile Python natively in the browser via Pyodide.
          </p>
        </div>
      </motion.div>

      {/* Simple instructions preview */}
      <motion.div 
        className="config-preview"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="config-title">Quick Connection Guide</div>
        <ol className="config-steps">
          <li>Enable the Google Drive API in Google Cloud Console.</li>
          <li>Create an OAuth Client ID for Web Applications (with Authorized Origin <code>http://localhost:5173</code>).</li>
          <li>Create an API Key. Add both in the settings panel.</li>
          <li>Click "Authorize" to link DriveIDE to your specific Drive folder.</li>
        </ol>
      </motion.div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleCredentialsSaved}
      />
    </div>
  );
}
