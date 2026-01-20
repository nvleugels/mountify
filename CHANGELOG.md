# Changelog

All notable changes to Mountify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-20

### Added

- Initial release of Mountify
- Automatic installation of WinFsp and SSHFS-Win dependencies
- Add, edit, and delete SFTP server configurations
- Mount and unmount SFTP servers as Windows drives
- Connection testing before saving server
- System tray integration with quick mount/unmount
- Auto-mount servers on Windows startup
- Settings for application behavior
- Encrypted password storage
- Toast notifications for mount events
- Responsive UI with Tailwind CSS
- Dark/light theme support for system tray icon

### Features

- **Server Management**: Manage unlimited SFTP connections
- **One-Click Mounting**: Quick mount/unmount toggles
- **Auto-Start**: Launch with Windows option
- **System Tray**: Minimize to tray and quick access
- **Secure Storage**: Encrypted credentials on device
- **Connection Testing**: Verify before saving
- **Custom Configuration**: Drive letters, labels, remote paths
- **Notifications**: Visual feedback for operations

### Technical

- Electron-based desktop application
- Vite for fast development and optimized builds
- Vanilla JavaScript (no heavy frameworks)
- Tailwind CSS for modern UI
- electron-store for persistent storage
- IPC communication between main and renderer processes

### Security

- Machine-specific encryption for passwords
- Context isolation enabled
- No telemetry or data collection
- Local storage only

---
 
