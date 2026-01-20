# Mountify

A free, open-source Windows application for mounting SFTP servers as local drives with a clean, minimal interface.

## Overview

Mountify is a simple desktop tool that lets you mount remote SFTP servers as Windows network drives. No subscriptions, no ads, no limitations - just reliable SFTP mounting with automatic dependency management.

## Key Features

- **One-Click Setup** - Automatic installation of required dependencies (WinFsp, SSHFS-Win) with a single UAC prompt
- **Clean Interface** - Modern, minimal design built with React and Tailwind CSS
- **Multiple Servers** - Save and manage unlimited SFTP connections
- **Auto-Mount** - Automatically mount servers on Windows startup
- **Connection Testing** - Verify credentials before saving
- **System Tray** - Quick access to mount/unmount from the system tray
- **Secure Storage** - Encrypted password storage on your device
- **Fully Responsive** - Adapts to any window size

## Why Mountify?

Frustrated with paid solutions like RaiDrive? Tired of command-line complexity? Mountify provides a beautiful, free alternative for developers who need reliable SFTP mounting.

### vs RaiDrive
- ✅ Completely free, no limitations
- ✅ Open source
- ✅ No advertisements
- ✅ Privacy-focused (no telemetry)

### vs Manual SSHFS-Win
- ✅ Graphical interface
- ✅ Save multiple server configurations
- ✅ Easy mount/unmount toggles
- ✅ Built-in connection testing

### vs WinSCP
- ✅ True drive mounting (not just file transfer)
- ✅ Works with any application (VS Code, Photoshop, etc.)
- ✅ Auto-mount on startup

## Technical Details

### Built With
- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **WinFsp** - Windows File System Proxy (auto-installed)
- **SSHFS-Win** - SFTP client for Windows (auto-installed)

### System Requirements
- Windows 10 or Windows 11 (64-bit)
- Administrator rights (for initial setup only)
- Active internet connection (for dependency installation)

### How It Works

Mountify is a user-friendly wrapper around battle-tested open-source tools:

1. **WinFsp** provides the kernel driver for file system operations
2. **SSHFS-Win** handles the SFTP protocol
3. **Mountify** provides the interface and automation

On first launch, Mountify automatically downloads and installs these dependencies silently, requiring only one UAC prompt.

## Features

### Server Management
- Add unlimited SFTP servers
- Edit existing configurations
- Delete servers with confirmation
- Test connections before saving
- Custom drive letters (D: through Z:)
- Custom drive labels
- Specify remote mount locations

### Mount Options
- Quick mount/unmount toggles
- Auto-mount specific servers on startup
- Visual status indicators (mounted/unmounted)
- System tray quick access
- Toast notifications for mount events

### Settings
- Start with Windows
- Minimize to system tray
- Show/hide notifications
- Connection timeout configuration
- Default port settings

### Security
- Passwords encrypted at rest
- Machine-specific encryption key
- No cloud sync or data transmission
- Credentials stored locally only
- Open source - audit the code yourself

## Roadmap

### Phase 1 (MVP) ✅
- Auto-install dependencies
- Add/edit/delete servers
- Mount/unmount functionality
- Connection testing
- Basic settings
- System tray integration
- Responsive UI

### Phase 2 (Planned)
- Dark mode
- SSH key authentication
- Import/export configurations
- Multiple mount locations per server
- Server groups/folders
- Advanced SSHFS options
- Detailed logging viewer

### Phase 3 (Future)
- Additional protocols (WebDAV, S3)
- Cross-platform (macOS, Linux)
- CLI interface
- Cloud config sync (optional)

## Contributing

Mountify is open source and welcomes contributions! Whether it's bug reports, feature requests, or pull requests - all contributions are appreciated.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/mountify.git
cd mountify

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

### Tech Stack
- Node.js 18+
- Electron
- React 18
- Vite
- Tailwind CSS
- Zustand

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Mountify is built on top of:
- [WinFsp](https://github.com/winfsp/winfsp) by Bill Zissimopoulos
- [SSHFS-Win](https://github.com/winfsp/sshfs-win) by Bill Zissimopoulos

## Support

- 🐛 [Report a bug](https://github.com/yourusername/mountify/issues)
- 💡 [Request a feature](https://github.com/yourusername/mountify/issues)
- 💬 [Discussions](https://github.com/yourusername/mountify/discussions)

## Disclaimer

Mountify is provided as-is without warranty. Always ensure you have backups of important data. The developers are not responsible for any data loss or system issues.

---

**Made with ❤️ for developers who need simple, reliable SFTP mounting**