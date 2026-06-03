import React from 'react';
import { motion } from 'framer-motion';
import { FolderGit, Play, Database, Cpu } from 'lucide-react';

export default function LandingPage({ isAuthed, onStart, onAuthRequest }) {
  const handleStartCoding = () => {
    if (isAuthed) {
      onStart();
    } else {
      onAuthRequest();
    }
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
          {isAuthed ? 'Open Editor' : 'Authorize Google Drive'}
        </button>
      </motion.div>

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

    </div>
  );
}
