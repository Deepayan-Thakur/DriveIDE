/**
 * Service to interact with Google Drive API v3 using GAPI and GIS.
 */

let gapiInited = false;
let gisInited = false;
let tokenClient = null;

// Helpers to load external Google scripts
export function loadGoogleApiScripts() {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.google) {
      resolve();
      return;
    }

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      gapiInited = true;
      checkInitialization();
    };
    gapiScript.onerror = reject;

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      gisInited = true;
      checkInitialization();
    };
    gisScript.onerror = reject;

    document.head.appendChild(gapiScript);
    document.head.appendChild(gisScript);

    function checkInitialization() {
      if (gapiInited && gisInited) {
        resolve();
      }
    }
  });
}

/**
 * Initializes the Google API client and Identity Services.
 */
export function initDriveClient({ clientId, apiKey, onAuthChange }) {
  return new Promise((resolve, reject) => {
    // 1. Initialize GAPI
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        
        // Restore existing token from localStorage if present
        const savedToken = localStorage.getItem('gdrive_token');
        if (savedToken) {
          const tokenObj = JSON.parse(savedToken);
          // Check if token is expired (access tokens usually expire in 3600 seconds)
          if (tokenObj.expires_at > Date.now()) {
            window.gapi.client.setToken(tokenObj);
            onAuthChange(true);
          } else {
            localStorage.removeItem('gdrive_token');
            onAuthChange(false);
          }
        } else {
          onAuthChange(false);
        }

        // 2. Initialize GIS Token Client
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file', // drive.file accesses files created/opened by this app
          callback: (resp) => {
            if (resp.error) {
              reject(resp);
              return;
            }
            // Add expiry time to token object
            const expires_at = Date.now() + (resp.expires_in * 1000);
            const tokenWithExpiry = { ...resp, expires_at };
            localStorage.setItem('gdrive_token', JSON.stringify(tokenWithExpiry));
            
            window.gapi.client.setToken(tokenWithExpiry);
            onAuthChange(true);
            resolve();
          },
        });

        resolve();
      } catch (err) {
        console.error('Error in GAPI/GIS client initialization', err);
        reject(err);
      }
    });
  });
}

/**
 * Requests authorization token.
 */
export function signIn() {
  if (!tokenClient) {
    throw new Error('Google Identity Services client is not initialized.');
  }
  // Request access token (will open popup if needed)
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Sign out - revokes the token and clears storage.
 */
export function signOut(onAuthChange) {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revokeToken(token.access_token, () => {
      window.gapi.client.setToken(null);
      localStorage.removeItem('gdrive_token');
      localStorage.removeItem('gdrive_workspace_folder_id');
      onAuthChange(false);
    });
  } else {
    localStorage.removeItem('gdrive_token');
    localStorage.removeItem('gdrive_workspace_folder_id');
    onAuthChange(false);
  }
}

/**
 * Checks if the user is authenticated.
 */
export function isAuthenticated() {
  if (!window.gapi || !window.gapi.client) return false;
  const token = window.gapi.client.getToken();
  if (!token) return false;
  
  // Verify token expiry
  const savedToken = localStorage.getItem('gdrive_token');
  if (savedToken) {
    const tokenObj = JSON.parse(savedToken);
    return tokenObj.expires_at > Date.now();
  }
  return false;
}

/**
 * Checks if a folder exists in Drive, otherwise creates it.
 */
export async function getOrCreateWorkspaceFolder(folderName = 'DriveIDE_Workspace') {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  // Search if folder already exists
  const response = await window.gapi.client.drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  const files = response.result.files || [];
  if (files.length > 0) {
    const folderId = files[0].id;
    localStorage.setItem('gdrive_workspace_folder_id', folderId);
    return folderId;
  }

  // Folder does not exist, create it
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const createResponse = await window.gapi.client.drive.files.create({
    resource: folderMetadata,
    fields: 'id'
  });

  const newFolderId = createResponse.result.id;
  localStorage.setItem('gdrive_workspace_folder_id', newFolderId);
  return newFolderId;
}

/**
 * Lists all contents (files & folders) inside the workspace folder recursively.
 */
export async function getWorkspaceTree(folderId) {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  async function fetchChildren(parentId) {
    const response = await window.gapi.client.drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      orderBy: 'folder,name',
      spaces: 'drive'
    });

    const files = response.result.files || [];
    const items = [];

    for (const file of files) {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      const item = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        isFolder,
        parentId,
        size: file.size,
        modifiedTime: file.modifiedTime,
        children: isFolder ? await fetchChildren(file.id) : null
      };
      items.push(item);
    }
    return items;
  }

  return await fetchChildren(folderId);
}

/**
 * Fetches file content.
 */
export async function getFileContent(fileId) {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  const response = await window.gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  });
  
  return response.body || '';
}

/**
 * Saves file content.
 */
export async function saveFileContent(fileId, content) {
  if (!isAuthenticated()) throw new Error('Not authenticated');
  const tokenObj = window.gapi.client.getToken();
  if (!tokenObj) throw new Error('No OAuth Token');

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenObj.access_token}`,
      'Content-Type': 'text/plain; charset=UTF-8'
    },
    body: content
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save file: ${errorText}`);
  }

  return true;
}

/**
 * Creates a new file in a parent folder.
 */
export async function createFile(parentId, name, content = '') {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  // Determine mime type based on extension
  let mimeType = 'text/plain';
  if (name.endsWith('.html')) mimeType = 'text/html';
  else if (name.endsWith('.css')) mimeType = 'text/css';
  else if (name.endsWith('.js') || name.endsWith('.jsx')) mimeType = 'application/javascript';
  else if (name.endsWith('.json')) mimeType = 'application/json';
  else if (name.endsWith('.py')) mimeType = 'text/x-python';

  const fileMetadata = {
    name: name,
    mimeType: mimeType,
    parents: [parentId]
  };

  const response = await window.gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id, name, mimeType, size, modifiedTime'
  });

  const fileId = response.result.id;
  if (content) {
    await saveFileContent(fileId, content);
  }

  return {
    id: fileId,
    name: response.result.name,
    mimeType: response.result.mimeType,
    isFolder: false,
    parentId,
    size: content.length,
    modifiedTime: response.result.modifiedTime,
    children: null
  };
}

/**
 * Creates a new folder.
 */
export async function createFolder(parentId, name) {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  const folderMetadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  const response = await window.gapi.client.drive.files.create({
    resource: folderMetadata,
    fields: 'id, name, mimeType, modifiedTime'
  });

  return {
    id: response.result.id,
    name: response.result.name,
    mimeType: response.result.mimeType,
    isFolder: true,
    parentId,
    modifiedTime: response.result.modifiedTime,
    children: []
  };
}

/**
 * Deletes an item (file or folder).
 */
export async function deleteItem(itemId) {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  await window.gapi.client.drive.files.delete({
    fileId: itemId
  });

  return true;
}

/**
 * Renames an item.
 */
export async function renameItem(itemId, newName) {
  if (!isAuthenticated()) throw new Error('Not authenticated');

  const response = await window.gapi.client.drive.files.update({
    fileId: itemId,
    resource: { name: newName },
    fields: 'id, name'
  });

  return response.result;
}
