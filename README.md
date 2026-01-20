# Mountify

![Mountify](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

A free, open-source Windows application for mounting SFTP servers as local drives with a clean, minimal interface.

## ✨ Features

- **🚀 One-Click Setup** - Automatic installation of WinFsp and SSHFS-Win
- **🎨 Clean Interface** - Modern, minimal design with Tailwind CSS
- **💾 Multiple Servers** - Save and manage unlimited SFTP connections
- **⚡ Auto-Mount** - Automatically mount servers on Windows startup
- **🔍 Connection Testing** - Verify credentials before saving
- **📟 System Tray** - Quick access to mount/unmount from the system tray
- **🔒 Secure Storage** - Encrypted password storage on your device
- **📱 Fully Responsive** - Adapts to any window size

## 📋 Requirements

- Windows 10 or Windows 11 (64-bit)
- Administrator rights (for initial dependency installation only)
- Active internet connection (for dependency installation)

## 🚀 Quick Start

### Download

Download the latest release from the [Releases page](https://github.com/yourusername/mountify/releases).

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/mountify.git
cd mountify

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

## 🎯 Usage

1. **First Launch** - Mountify will prompt you to install WinFsp and SSHFS-Win dependencies
2. **Add Server** - Click "Add Server" and enter your SFTP server details
3. **Test Connection** - Use the "Test Connection" button to verify your credentials
4. **Mount** - Click the "Mount" button to connect your SFTP server as a local drive
5. **Access** - Your remote files are now available in Windows Explorer!

## 🔧 Configuration

### Server Settings

- **Server Name**: A friendly name for your server
- **Host**: The SFTP server address (e.g., example.com)
- **Port**: SSH port (default: 22)
- **Username**: Your SSH username
- **Password**: Your SSH password
- **Drive Letter**: The Windows drive letter to use (S: through Z:)
- **Remote Path**: The remote directory to mount (default: /)
- **Drive Label**: Optional label for the drive
- **Auto-mount**: Mount automatically on Windows startup

### Application Settings

- **Start with Windows**: Launch Mountify when Windows starts
- **Minimize to tray**: Keep running in the system tray when closed
- **Show notifications**: Display notifications for mount/unmount events
- **Connection timeout**: How long to wait for connection attempts
- **Default port**: Default SSH port for new servers

## 🏗️ Technical Stack

- **Electron** - Desktop framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - No heavy frameworks, just clean JS
- **electron-store** - Persistent storage with encryption
- **WinFsp** - Windows File System Proxy (auto-installed)
- **SSHFS-Win** - SFTP client for Windows (auto-installed)

## 📁 Project Structure

```
mountify/
├── electron/           # Electron main process
│   ├── main.js        # Main process entry point
│   └── preload.js     # Preload script for IPC
├── src/               # Renderer process (UI)
│   ├── main.js        # UI logic
│   └── style.css      # Tailwind styles
├── build/             # Build assets (icons, etc.)
├── index.html         # Main HTML file
├── package.json       # Dependencies and scripts
├── vite.config.js     # Vite configuration
└── tailwind.config.js # Tailwind configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Mountify is built on top of:

- [WinFsp](https://github.com/winfsp/winfsp) by Bill Zissimopoulos
- [SSHFS-Win](https://github.com/winfsp/sshfs-win) by Bill Zissimopoulos

## ⚠️ Disclaimer

Mountify is provided as-is without warranty. Always ensure you have backups of important data. The developers are not responsible for any data loss or system issues.

## 📞 Support

- 🐛 [Report a bug](https://github.com/yourusername/mountify/issues)
- 💡 [Request a feature](https://github.com/yourusername/mountify/issues)
- 💬 [Discussions](https://github.com/yourusername/mountify/discussions)

---

**Made with ❤️ for developers who need simple, reliable SFTP mounting**
