# Mountify

![Mountify](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

A small, focused app to mount SFTP servers as Windows drives. This README is organized for end-users first — installation and usage up top, development and code details below.

## 🚀 Install & Run (User-focused)

### Download

Download the latest release from the Releases page:

- https://github.com/nvleugels/mountify/releases

### Install (Windows)

1. Download the latest installer (NSIS / EXE) from the Releases page.
2. Run the installer and follow the prompts.
3. Launch Mountify from the Start menu or system tray.

On first launch Mountify may prompt to install two required dependencies (WinFsp and SSHFS-Win). Accept the prompts — the app will run an installer with UAC to complete the setup.

### Quick Start (after install)

1. Open Mountify and click "Add Server".
2. Enter server details (host, port, username, password).
3. Choose a drive letter and optional remote path/label.
4. Click "Test Connection" to verify network reachability.
5. Click "Save Server", then "Mount" to connect the remote as a local drive.

Files appear in Windows Explorer under the assigned drive letter.

## 🎯 Usage Notes

- Auto-mount: enable the "Mount automatically on startup" option to have Mountify mount that server at login.
- System tray: closing the window (when configured) keeps Mountify running in the tray for quick mounts.
- Notifications: Mount/unmount success and failures are shown via Windows notifications (can be disabled in Settings).

## 📋 Requirements

- Windows 10 or Windows 11 (64-bit)
- Administrator rights only required for the initial dependency installation
- Internet access for downloading dependencies and updates

## 🔧 Troubleshooting

- If a mount fails, check network connectivity and that the SSH port is reachable.
- If a drive letter is already in use, choose a different letter in the server settings.
- If dependencies fail to install automatically, download and install WinFsp and SSHFS-Win manually from their GitHub releases.

---

## 🧭 For Developers / Codebase

If you're interested in the code, development instructions are below.

### Quick dev setup

```bash
git clone https://github.com/nvleugels/mountify.git
cd mountify
npm install
npm run dev
```

### Project structure

```
mountify/
├── electron/           # Main process
│   ├── main.js        # Main process entry point
│   └── preload.js     # Preload script for IPC
├── src/               # Renderer process (UI)
│   ├── main.js        # UI logic
│   └── style.css      # Tailwind styles
├── build/             # Build assets (icons, etc.)
├── index.html         # Main HTML file
├── package.json       # Dependencies and scripts
└── tailwind.config.js # Tailwind configuration
```

### Release process

1. Update the version in `package.json` and `CHANGELOG.md`.
2. Build the installer via your release pipeline (or `npm run electron:build`).
3. Create a GitHub Release and upload the built artifacts (NSIS/EXE installers). The app uses GitHub Releases for auto-update.

### Notes on auto-update

Mountify uses `electron-updater` with GitHub Releases as the provider. To publish artifacts automatically, set up CI (GitHub Actions recommended) with a `GH_TOKEN` that can create releases.

---

## 🤝 Contributing

Contributions welcome — please open a PR. See the `DEVELOPMENT.md` for more details.

## 📝 License

MIT — see [LICENSE](LICENSE).

---

Made with ❤️ for people who prefer simple tools.
