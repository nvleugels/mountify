const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  // Server operations
  getServers: () => ipcRenderer.invoke("get-servers"),
  saveServer: (server) => ipcRenderer.invoke("save-server", server),
  deleteServer: (serverId) => ipcRenderer.invoke("delete-server", serverId),
  mountServer: (serverId) => ipcRenderer.invoke("mount-server", serverId),
  unmountServer: (serverId) => ipcRenderer.invoke("unmount-server", serverId),
  testConnection: (server) => ipcRenderer.invoke("test-connection", server),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // System
  getAvailableDrives: () => ipcRenderer.invoke("get-available-drives"),

  // Dependencies
  checkDependencies: () => {
    console.log("checkDependencies called in preload");
    return ipcRenderer.invoke("check-dependencies");
  },
  installDependencies: () => ipcRenderer.invoke("install-dependencies"),
  uninstallDependency: (name) =>
    ipcRenderer.invoke("uninstall-dependency", name),

  // Event listeners
  onServersUpdated: (callback) => {
    ipcRenderer.on("servers-updated", (event, servers) => callback(servers));
  },
  onMountResult: (callback) => {
    ipcRenderer.on("mount-result", (event, result) => callback(result));
  },
  onUnmountResult: (callback) => {
    ipcRenderer.on("unmount-result", (event, result) => callback(result));
  },
  onDependencyStatus: (callback) => {
    ipcRenderer.on("dependency-status", (event, status) => callback(status));
  },
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  onUpdateAvailable: (callback) =>
    ipcRenderer.on("update-available", (event, info) => callback(info)),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", (event, info) => callback(info)),
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, progress) =>
      callback(progress),
    ),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", (event, info) => callback(info)),
  // Quit and install
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
});

console.log("electronAPI exposed to window");
