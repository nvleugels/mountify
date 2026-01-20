# Development Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Windows 10/11 (64-bit)
- Git

## Setup

1. Clone the repository:

```bash
git clone https://github.com/nvleugels/mountify.git
cd mountify
```

2. Install dependencies:

```bash
npm install
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This will launch the app in development mode with live reload where available.

### Building for Production

```bash
npm run electron:build
```

This will create a distributable package in the `release/` directory.

## Project Structure

```
mountify/
├── electron/              # Electron main process
│   ├── main.js           # Main process logic
│   └── preload.js        # Preload script (IPC bridge)
├── src/                  # Renderer process (UI)
│   ├── main.js          # Application logic
│   └── style.css        # Tailwind CSS styles
├── build/               # Build assets
│   ├── icon.ico         # App icon
│   └── tray-icon.png    # System tray icon
├── index.html           # Main HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── package.json         # Project dependencies
```

## Key Technologies

### Electron

- **Main Process**: Node.js environment with full system access
- **Renderer Process**: Chromium browser environment (UI)
- **IPC**: Communication between main and renderer processes
- **Preload Script**: Secure bridge for exposing APIs to renderer

### Build tooling

- Development and packaging are handled by npm scripts in `package.json`.

### Tailwind CSS

- Utility-first CSS framework
- Custom theme configuration in `tailwind.config.js`
- PostCSS processing

## IPC Communication

### Renderer to Main (Invoke)

```javascript
// Renderer (src/main.js)
const result = await window.electronAPI.getServers();

// Preload (electron/preload.js)
contextBridge.exposeInMainWorld("electronAPI", {
  getServers: () => ipcRenderer.invoke("get-servers"),
});

// Main (electron/main.js)
ipcMain.handle("get-servers", () => {
  return store.get("servers", []);
});
```

### Main to Renderer (Send)

```javascript
// Main (electron/main.js)
mainWindow.webContents.send("servers-updated", servers);

// Preload (electron/preload.js)
onServersUpdated: (callback) => {
  ipcRenderer.on("servers-updated", (event, servers) => callback(servers));
};

// Renderer (src/main.js)
window.electronAPI.onServersUpdated((servers) => {
  console.log("Servers updated:", servers);
});
```

## Data Storage

Uses `electron-store` for persistent data:

```javascript
const Store = require("electron-store");
const store = new Store({
  encryptionKey: "mountify-encryption-key-" + require("os").hostname(),
});

// Save
store.set("servers", serversArray);

// Load
const servers = store.get("servers", []);

// Delete
store.delete("servers");
```

Data is stored in:

- Windows: `%APPDATA%\mountify\config.json`

## SSHFS Operations

### Mounting

```bash
net use S: "\\sshfs\user@host!port/path"
```

### Unmounting

```bash
net use S: /delete /y
```

### Authentication

SSHFS-Win reads credentials from Windows Credential Manager or SSH config.

## Adding New Features

### Add a New IPC Handler

1. Add handler in `electron/main.js`:

```javascript
ipcMain.handle("my-new-feature", async (event, arg) => {
  // Your logic here
  return { success: true, data: result };
});
```

2. Expose in `electron/preload.js`:

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  // ... existing methods
  myNewFeature: (arg) => ipcRenderer.invoke("my-new-feature", arg),
});
```

3. Use in `src/main.js`:

```javascript
const result = await window.electronAPI.myNewFeature(arg);
```

## Debugging

### Main Process

- Console logs appear in terminal
- Use `console.log()` liberally
- Check Electron version compatibility

### Renderer Process

- DevTools open automatically in dev mode
- Use `console.log()` and browser debugging tools
- Check Network tab for resource loading

### Common Issues

**App won't start:**

- Check Node.js version (18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Build fails:**

- Ensure all dependencies are installed
- Check build assets exist (icons)
- Verify code signing settings (if applicable)

**SSHFS mount fails:**

- Verify WinFsp and SSHFS-Win are installed
- Check credentials and network connectivity
- Review Windows Event Viewer for errors
- Ensure drive letter isn't already in use

## Testing

### Manual Testing Checklist

- [ ] Add server with valid credentials
- [ ] Add server with invalid credentials
- [ ] Test connection button works
- [ ] Mount server successfully
- [ ] Unmount server successfully
- [ ] Edit existing server
- [ ] Delete server
- [ ] Auto-mount on startup
- [ ] System tray integration
- [ ] Settings persistence
- [ ] Minimize to tray
- [ ] Notifications display
- [ ] Dependency installation

## Performance Tips

- Minimize IPC calls - batch operations when possible
- Use efficient DOM updates - only update changed elements
- Lazy load heavy operations
- Cache data when appropriate

## Security Considerations

- Passwords are encrypted using `electron-store` with machine-specific key
- Never log sensitive data (passwords, keys)
- Validate all user inputs
- Use `contextIsolation: true` (already configured)
- Keep dependencies updated

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Build: `npm run electron:build`
4. Test the built application thoroughly
5. Create GitHub release
6. Upload installers from `release/` directory

## Publishing & CI (GitHub Actions)

To enable automatic building and publishing of installers via GitHub Actions you need to provide a token that allows the workflow to create releases and upload assets.

1. Create a Personal Access Token (PAT):

- Go to https://github.com/settings/tokens (or use the GitHub CLI).
- Click "Generate new token" → give it a descriptive name (e.g. "mountify-release-bot").
- Select the `repo` scope (this allows creating releases and uploading assets).
- Create token and copy the value — you will not be able to view it again.

2. Add the token as a repository secret:

- In the GitHub repo: Settings → Secrets and variables → Actions → New repository secret.
- Name: `GH_TOKEN`
- Value: paste the PAT you copied.

Alternatively, using the GitHub CLI (if installed and authenticated):

```bash
# authenticate if needed
gh auth login

# set the secret (you will be prompted for the token value)
gh secret set GH_TOKEN --repo nvleugels/mountify
```

3. Verify workflow and package.json:

- Ensure `package.json` contains the correct `build.publish` entry with `owner: "nvleugels"` and `repo: "mountify"` (already configured).
- The workflow `.github/workflows/release.yml` will run on tag pushes (`v*`) or when triggered manually.

4. Create a release (trigger CI):

- Locally tag and push a version tag to trigger the workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

- Or create a release in the GitHub UI; the workflow can be triggered manually from the Actions tab if needed.

Notes:

- Use a PAT with least-privilege (repo scope). For organizational or automated setups you may prefer a machine user with a token.
- If you intend to sign installers, store signing secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`) in the repo secrets as well and update the workflow to load them.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WinFsp Documentation](https://github.com/winfsp/winfsp)
- [SSHFS-Win Documentation](https://github.com/winfsp/sshfs-win)
