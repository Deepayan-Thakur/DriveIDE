# 🌌 DriveIDE

DriveIDE is a premium, client-side developer workspace powered by the **Monaco Editor** (the same engine behind VS Code). It allows you to build, edit, and run code entirely in your browser while saving your files directly to **Google Drive** with complete privacy.

---

## ✨ Features

- 📂 **Google Drive Storage Sync**: Automatic, real-time background synchronization of files and folders directly to a dedicated workspace folder inside your personal Google Drive.
- 💻 **Monaco Editor Integration**: Write code with IntelliSense, syntax highlighting, bracket matching, and multi-cursor support.
- ⚡ **Code Runner Panel**:
  - **Python compiler**: Run Python scripts client-side in the browser using Wasm-powered **Pyodide**.
  - **JavaScript console**: Run JS snippets directly with console logging interceptors.
  - **Web Previews**: Real-time live web-previews of HTML pages with inline resolving of project script and stylesheet files.
- 🔒 **Serverless & Private**: All file operations, compiling, and execution occur entirely client-side. Your code never hits third-party servers.
- 🎨 **Premium Glassmorphic UI**: Beautiful responsive interface styled with CSS glassmorphism, fluid animations, and a sleek dark theme.

---

## 🛠️ Tech Stack

- **Core**: React 19, Vite
- **Styling**: Vanilla CSS, Glassmorphism, Framer Motion
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Python Execution**: Pyodide (Wasm)
- **Icons**: Lucide React
- **Storage**: Google Drive API v3 (via GAPI + Google Identity Services)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/Deepayan-Thakur/DriveIDE.git
cd DriveIDE
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup local environment variables
Create a `.env.local` file in the root of the project:
```env
VITE_GDRIVE_CLIENT_ID=your-google-oauth-client-id-here.apps.googleusercontent.com
VITE_GDRIVE_API_KEY=your-google-api-key-here
```

### 4. Run the development server
```bash
npm run dev
```

---

## 🌐 Deploy to Vercel

You can publish DriveIDE to Vercel with ease.

1. Connect your repository to **Vercel**.
2. Under **Environment Variables** in the deployment settings, configure:
   - `VITE_GDRIVE_CLIENT_ID`
   - `VITE_GDRIVE_API_KEY`
3. Deploy!

> [!IMPORTANT]
> Make sure to add your Vercel deployment URL (e.g., `https://drive-ide.vercel.app`) to your Google Cloud Console under **Authorized JavaScript origins** and **Authorized redirect URIs**.

---

## 🔑 How to Get Google API Credentials

To link the editor with Google Drive, you will need credentials from the **Google Cloud Console**:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `DriveIDE`.
3. Enable the **Google Drive API**:
   - Go to **APIs & Services** > **Library**, search for "Google Drive API" and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen** (or **Google Auth Platform**).
   - Select **External**, configure basic app info (e.g. app name and contact email).
   - Add the scope: `https://www.googleapis.com/auth/drive.file` (this scope allows the app to only read/write files that *it* creates, keeping the rest of your Drive secure).
   - Under **Audience** (or **Test users**), add your own email address so you can log in during the testing phase.
5. Create **Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **+ Create Credentials** > **API Key**. Copy it.
   - Click **+ Create Credentials** > **OAuth client ID**. Select **Web application**.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173` (Local development)
     - `https://your-vercel-domain.vercel.app` (Your production URL)
   - Copy the generated **Client ID**.
6. Provide these credentials when launching the app or set them in the `.env` variables!
