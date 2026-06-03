import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { 
  loadGoogleApiScripts, 
  initDriveClient, 
  signIn, 
  isAuthenticated 
} from './services/googleDriveService';
import LandingPage from './components/LandingPage';
import EditorPage from './components/EditorPage';

export default function App() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isEditingStarted, setIsEditingStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Google APIs
  useEffect(() => {
    async function loadApis() {
      try {
        setLoading(true);
        await loadGoogleApiScripts();
        setScriptsLoaded(true);

        const clientId = localStorage.getItem('gdrive_client_id') || import.meta.env.VITE_GDRIVE_CLIENT_ID;
        const apiKey = localStorage.getItem('gdrive_api_key') || import.meta.env.VITE_GDRIVE_API_KEY;

        if (clientId && apiKey) {
          await initDriveClient({
            clientId,
            apiKey,
            onAuthChange: (authed) => {
              setIsAuthed(authed);
            }
          });
          setIsAuthed(isAuthenticated());
        }
      } catch (err) {
        console.error('Error loading Google API scripts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApis();
  }, []);

  const handleAuthChange = (authed) => {
    setIsAuthed(authed);
    if (authed) {
      setIsEditingStarted(true);
    }
  };

  const handleStartEditing = () => {
    setIsEditingStarted(true);
  };

  const handleAuthRequest = () => {
    try {
      signIn();
    } catch (err) {
      alert(`Sign in error: ${err.message}`);
    }
  };

  const handleLogoutSuccess = () => {
    setIsAuthed(false);
    setIsEditingStarted(false);
  };

  if (loading) {
    return (
      <div className="ide-empty-state" style={{ height: '100vh', gap: '16px' }}>
        <div className="glow-bg">
          <div className="glow-orb-1"></div>
          <div className="glow-orb-2"></div>
        </div>
        <Loader size={48} className="animated-spin" style={{ color: 'var(--accent-cyan)' }} />
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Loading application engine...
        </div>
      </div>
    );
  }

  // Route between Landing and Editor
  if (isEditingStarted && isAuthed) {
    return <EditorPage onLogout={handleLogoutSuccess} />;
  }

  return (
    <LandingPage 
      isAuthed={isAuthed} 
      onStart={handleStartEditing} 
      onAuthRequest={handleAuthRequest}
    />
  );
}
