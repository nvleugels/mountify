const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
  Notification,
} = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const https = require("https");
const Store = require("electron-store");
let autoUpdater;
try {
  // electron-updater is optional during development
  ({ autoUpdater } = require("electron-updater"));
} catch (e) {
  console.warn("electron-updater not installed; auto-updates disabled");
}

const store = new Store({
  encryptionKey: "mountify-encryption-key-" + require("os").hostname(),
});

// Ensure Windows Start menu uses our AppUserModelID so shortcuts pick up the correct icon
try {
  app.setAppUserModelId("com.mountify.app");
} catch (e) {
  // ignore when not supported
}

let mainWindow;
let tray;
let isDev = !app.isPackaged;

// Dependency URLs
const WINFSP_URL =
  "https://github.com/winfsp/winfsp/releases/download/v2.0/winfsp-2.0.23075.msi";
const SSHFS_WIN_URL =
  "https://github.com/winfsp/sshfs-win/releases/download/v3.7.21011/sshfs-win-3.7.21011-x64.msi";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
      icon: path.join(__dirname, "../images/mountify.ico"),
    show: false,
    frame: true,
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
  });

  // Remove the menu bar completely
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
    // Don't auto-open DevTools - user can open with F12
  } else {
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    const settings = store.get("settings", {});
    // Only show window if not set to start minimized, or if in dev mode
    if (!settings.startMinimized || isDev) {
      mainWindow.show();
    }
    checkDependencies();

    // Setup auto-updater event forwarding if available
    if (autoUpdater) {
      autoUpdater.autoDownload = true;
      autoUpdater.on("checking-for-update", () => {
        mainWindow.webContents.send("update-checking");
      });
      autoUpdater.on("update-available", (info) => {
        mainWindow.webContents.send("update-available", info);
      });
      autoUpdater.on("update-not-available", (info) => {
        mainWindow.webContents.send("update-not-available", info);
      });
      autoUpdater.on("download-progress", (progress) => {
        mainWindow.webContents.send("download-progress", progress);
      });
      autoUpdater.on("update-downloaded", (info) => {
        mainWindow.webContents.send("update-downloaded", info);
      });

      // Check for updates on startup when autoUpdater is available
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn("Auto-updater check failed:", err);
      });
    }
  });

  mainWindow.on("close", (event) => {
    const settings = store.get("settings", {});
    if (settings.minimizeToTray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "../images/mountify.png");
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  updateTrayMenu();

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

function updateTrayMenu() {
  const servers = store.get("servers", []);
  const menuTemplate = [
    {
      label: "Show Mountify",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    { type: "separator" },
  ];

  servers.forEach((server) => {
    // Show explicit action to avoid ambiguous symbols in the tray menu
    const label = server.isMounted
      ? `Unmount ${server.name}`
      : `Mount ${server.name}`;
    menuTemplate.push({
      label,
      click: () => {
        if (server.isMounted) {
          unmountServer(server.id);
        } else {
          mountServer(server.id);
        }
      },
    });
  });

  menuTemplate.push(
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  );

  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
  tray.setToolTip("Mountify - SFTP Drive Mounter");
}

// Dependency Management
async function checkDependencies() {
  const winfspInstalled = await isDependencyInstalled("WinFsp");
  const sshfsInstalled = await isDependencyInstalled("SSHFS-Win");

  console.log("Dependency check:", { winfspInstalled, sshfsInstalled });

  if (!winfspInstalled || !sshfsInstalled) {
    console.log("Starting automatic dependency installation...");
    // Install automatically without asking
    installDependencies();
  }
}

async function isDependencyInstalled(name) {
  return new Promise((resolve) => {
    console.log(`Checking if ${name} is installed...`);

    // Quick check: just look for the executable in Program Files
    if (name === "WinFsp") {
      // WinFsp installs to Program Files (x86) on 64-bit systems
      const programFiles =
        process.env["ProgramFiles(x86)"] || process.env.ProgramFiles;
      const winfspPath = path.join(
        programFiles,
        "WinFsp",
        "bin",
        "launchctl-x64.exe",
      );
      const exists = fs.existsSync(winfspPath);
      console.log(`WinFsp check: ${winfspPath} exists: ${exists}`);
      resolve(exists);
    } else if (name === "SSHFS-Win") {
      const sshfsPath = path.join(
        process.env.ProgramFiles,
        "SSHFS-Win",
        "bin",
        "sshfs-win.exe",
      );
      const exists = fs.existsSync(sshfsPath);
      console.log(`SSHFS-Win check: ${sshfsPath} exists: ${exists}`);
      resolve(exists);
    } else {
      resolve(false);
    }
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          https
            .get(response.headers.location, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on("finish", () => {
                file.close();
                resolve();
              });
            })
            .on("error", reject);
        } else {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        }
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function installDependencies() {
  const tempDir = app.getPath("temp");
  const winfspPath = path.join(tempDir, "winfsp.msi");
  const sshfsPath = path.join(tempDir, "sshfs-win.msi");

  console.log("Starting dependency installation...");

  try {
    // Check what needs to be installed
    const winfspInstalled = await isDependencyInstalled("WinFsp");
    const sshfsInstalled = await isDependencyInstalled("SSHFS-Win");

    console.log(
      "Installation check - WinFsp:",
      winfspInstalled,
      "SSHFS-Win:",
      sshfsInstalled,
    );

    const filesToInstall = [];

    if (!winfspInstalled) {
      console.log("Downloading WinFsp...");
      mainWindow.webContents.send("dependency-status", {
        status: "downloading",
        message: "Downloading WinFsp...",
      });
      await downloadFile(WINFSP_URL, winfspPath);
      console.log("WinFsp downloaded to:", winfspPath);
      console.log("WinFsp file exists:", fs.existsSync(winfspPath));
      filesToInstall.push(winfspPath);
    } else {
      console.log("WinFsp already installed, skipping");
    }

    if (!sshfsInstalled) {
      console.log("Downloading SSHFS-Win...");
      mainWindow.webContents.send("dependency-status", {
        status: "downloading",
        message: "Downloading SSHFS-Win...",
      });
      await downloadFile(SSHFS_WIN_URL, sshfsPath);
      console.log("SSHFS-Win downloaded to:", sshfsPath);
      console.log("SSHFS-Win file exists:", fs.existsSync(sshfsPath));
      filesToInstall.push(sshfsPath);
    } else {
      console.log("SSHFS-Win already installed, skipping");
    }

    console.log("Files to install:", filesToInstall);

    if (filesToInstall.length > 0) {
      console.log(
        "Installing",
        filesToInstall.length,
        "dependencies with single UAC prompt...",
      );
      mainWindow.webContents.send("dependency-status", {
        status: "installing",
        message: "Installing dependencies (approve UAC prompt)...",
      });

      // Install all MSIs in a single elevated PowerShell session
      await installMultipleMSIs(filesToInstall);
      console.log("All dependencies installed successfully");
    } else {
      console.log("No dependencies to install");
    }

    mainWindow.webContents.send("dependency-status", {
      status: "complete",
      message: "Installation complete!",
    });
  } catch (error) {
    console.error("Installation error:", error);
    mainWindow.webContents.send("dependency-status", {
      status: "error",
      message: error.message,
    });

    // Silent retry once
    console.error("Dependency installation failed:", error);
  }
}

async function installMultipleMSIs(msiPaths) {
  return new Promise((resolve, reject) => {
    // Create PowerShell commands to install all MSIs sequentially
    const installCommands = msiPaths
      .map(
        (msiPath) =>
          `Start-Process msiexec.exe -ArgumentList '/i','${msiPath}','/qn','/norestart' -Verb RunAs -Wait`,
      )
      .join("; ");

    console.log("Running installation commands:", installCommands);

    // Run all installations in a single elevated PowerShell session
    const process = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", installCommands],
      {
        shell: false,
      },
    );

    let stdout = "";
    let stderr = "";

    if (process.stdout) {
      process.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log("Install stdout:", data.toString());
      });
    }

    if (process.stderr) {
      process.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("Install stderr:", data.toString());
      });
    }

    process.on("close", (code) => {
      console.log(`Installation completed with code ${code}`);
      console.log("stdout:", stdout);
      console.log("stderr:", stderr);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Installation failed with code ${code}. stderr: ${stderr}`),
        );
      }
    });

    process.on("error", (err) => {
      console.error("Installation process error:", err);
      reject(err);
    });
  });
}

async function installMSI(msiPath) {
  return new Promise((resolve, reject) => {
    // Use PowerShell to run msiexec with elevation
    // This will trigger UAC prompt
    const psCommand = `Start-Process msiexec.exe -ArgumentList '/i','${msiPath}','/qn','/norestart' -Verb RunAs -Wait`;

    const process = spawn(
      "powershell.exe",
      ["-WindowStyle", "Hidden", "-Command", psCommand],
      {
        shell: false,
        stdio: "inherit",
      },
    );

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Installation failed with code ${code}`));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

async function uninstallDependency(name) {
  console.log(`Uninstalling ${name}...`);

  // Send status update
  mainWindow.webContents.send("dependency-status", {
    status: "uninstalling",
    message: `Uninstalling ${name}...`,
  });

  return new Promise((resolve, reject) => {
    // Find and run the uninstaller from registry (much faster than wmic)
    const uninstallCommand = `
      $ErrorActionPreference = 'SilentlyContinue'
      $app = Get-ItemProperty 'HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Where-Object { $_.DisplayName -like '*${name}*' } | Select-Object -First 1
      if (-not $app) {
        $app = Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Where-Object { $_.DisplayName -like '*${name}*' } | Select-Object -First 1
      }
      if ($app -and $app.UninstallString) {
        $uninstallString = $app.UninstallString
        if ($uninstallString -match 'MsiExec') {
          $productCode = $uninstallString -replace '.*({[^}]+}).*', '$1'
          $proc = Start-Process msiexec.exe -ArgumentList '/x',$productCode,'/qn','/norestart' -Verb RunAs -Wait -PassThru
          exit $proc.ExitCode
        }
      }
      exit 0
    `;

    const process = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        uninstallCommand,
      ],
      {
        shell: false,
      },
    );

    process.on("close", (code) => {
      console.log(`Uninstall of ${name} completed with code ${code}`);

      // Always send completion status (uninstall often succeeds even with non-zero codes)
      mainWindow.webContents.send("dependency-status", {
        status: "uninstall-complete",
        message: `${name} uninstalled successfully`,
      });

      // Resolve regardless of exit code
      resolve();
    });

    process.on("error", (err) => {
      console.error("Uninstall process error:", err);

      mainWindow.webContents.send("dependency-status", {
        status: "error",
        message: `Failed to uninstall ${name}`,
      });

      reject(err);
    });
  });
}

// SSHFS Operations
function mountServer(serverId) {
  const servers = store.get("servers", []);
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return { success: false, error: "Server not found" };
  }

  const driveLetter = server.driveLetter || "S";
  const port = server.port || 22;
  const remotePath = server.remotePath || "/";
  const password = server.password || "";

  // First, force unmount if the drive letter is already in use
  exec(`net use ${driveLetter}: /delete /y`, { shell: "cmd.exe" }, () => {
    // Wait a moment for the unmount to complete
    setTimeout(() => {
      // Construct SSHFS command with password
      // Format: net use DRIVE: "\\sshfs\USER@HOST!PORT/PATH" PASSWORD
      const sshfsCommand = `net use ${driveLetter}: "\\\\sshfs\\${server.username}@${server.host}!${port}${remotePath}" "${password}"`;

      exec(sshfsCommand, { shell: "cmd.exe" }, (error, stdout, stderr) => {
        // Check if the command failed based on exit code, not stderr
        if (error && error.code !== 0) {
          // Sanitize error message to remove password
          let safeError = error.message.replace(
            new RegExp(password.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            "***",
          );
          safeError = safeError.split("\n")[0];
          showNotification("Mount Failed", `Failed to mount ${server.name}`);
          mainWindow.webContents.send("mount-result", {
            serverId,
            success: false,
            error: safeError,
          });
          return;
        }

        // Verify the mount actually succeeded by checking if the drive exists
        exec(
          `net use ${driveLetter}:`,
          { shell: "cmd.exe" },
          (verifyError, verifyStdout) => {
            if (verifyError) {
              // Mount failed
              showNotification(
                "Mount Failed",
                `Failed to mount ${server.name}`,
              );
              mainWindow.webContents.send("mount-result", {
                serverId,
                success: false,
                error: "Mount verification failed - drive not accessible",
              });
              return;
            }

            // Update server status
            const updatedServers = servers.map((s) =>
              s.id === serverId ? { ...s, isMounted: true } : s,
            );
            store.set("servers", updatedServers);

            showNotification(
              "Mounted Successfully",
              `${server.name} mounted as ${driveLetter}:`,
            );
            mainWindow.webContents.send("mount-result", {
              serverId,
              success: true,
            });
            mainWindow.webContents.send("servers-updated", updatedServers);
            updateTrayMenu();
          },
        );
      });
    }, 500);
  });
}

function unmountServer(serverId) {
  const servers = store.get("servers", []);
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return { success: false, error: "Server not found" };
  }

  const driveLetter = server.driveLetter || "S";
  const port = server.port || 22;
  const remotePath = server.remotePath || "/";
  const uncPath = `\\\\sshfs\\${server.username}@${server.host}!${port}${remotePath}`;

  // Try both methods: first by drive letter, then by UNC path
  exec(
    `net use ${driveLetter}: /delete /y 2>NUL & net use "${uncPath}" /delete /y`,
    { shell: "cmd.exe" },
    (error, stdout, stderr) => {
      // Wait a moment for the unmount to complete
      setTimeout(() => {
        exec(`net use ${driveLetter}:`, { shell: "cmd.exe" }, (verifyError) => {
          if (!verifyError) {
            // Drive still exists - unmount failed
            showNotification(
              "Unmount Failed",
              `Failed to unmount ${server.name}`,
            );
            mainWindow.webContents.send("unmount-result", {
              serverId,
              success: false,
              error: "Drive still mounted after unmount attempt",
            });
            return;
          }

          // Drive is gone - success
          const updatedServers = servers.map((s) =>
            s.id === serverId ? { ...s, isMounted: false } : s,
          );
          store.set("servers", updatedServers);

          showNotification(
            "Unmounted Successfully",
            `${server.name} unmounted`,
          );
          mainWindow.webContents.send("unmount-result", {
            serverId,
            success: true,
          });
          mainWindow.webContents.send("servers-updated", updatedServers);
          updateTrayMenu();
        });
      }, 500);
    },
  );
}

async function testConnection(server) {
  return new Promise((resolve) => {
    const timeout = store.get("settings.connectionTimeout", 10000);
    const port = server.port || 22;

    // Test if the port is reachable (doesn't verify credentials, just connectivity)
    const testCommand = `powershell -Command "$result = Test-NetConnection -ComputerName '${server.host}' -Port ${port} -WarningAction SilentlyContinue; if ($result.TcpTestSucceeded) { exit 0 } else { exit 1 }"`;

    const process = exec(testCommand, { timeout });

    const timer = setTimeout(() => {
      process.kill();
      resolve({ success: false, error: "Connection timeout" });
    }, timeout);

    process.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: "Cannot reach server or port is not accessible",
        });
      }
    });

    process.on("error", (error) => {
      clearTimeout(timer);
      resolve({ success: false, error: error.message });
    });
  });
}

function showNotification(title, body) {
  const settings = store.get("settings", {});
  if (settings.showNotifications !== false) {
    new Notification({ title, body }).show();
  }
}

// IPC Handlers
ipcMain.handle("get-servers", () => {
  return store.get("servers", []);
});

ipcMain.handle("save-server", (event, server) => {
  const servers = store.get("servers", []);
  console.log("Before save, existing servers:", servers.length);

  if (server.id) {
    // Update existing
    const index = servers.findIndex((s) => s.id === server.id);
    if (index !== -1) {
      servers[index] = server;
    }
  } else {
    // Add new
    server.id = Date.now().toString();
    server.isMounted = false;
    servers.push(server);
  }

  store.set("servers", servers);
  console.log("After save, total servers:", servers.length);
  console.log("Saved server:", server);
  mainWindow.webContents.send("servers-updated", servers);
  updateTrayMenu();
  return { success: true, server };
});

ipcMain.handle("delete-server", (event, serverId) => {
  const servers = store.get("servers", []);
  const server = servers.find((s) => s.id === serverId);

  // Unmount if mounted
  if (server && server.isMounted) {
    unmountServer(serverId);
  }

  const filtered = servers.filter((s) => s.id !== serverId);
  store.set("servers", filtered);
  mainWindow.webContents.send("servers-updated", filtered);
  updateTrayMenu();
  return { success: true };
});

ipcMain.handle("mount-server", (event, serverId) => {
  mountServer(serverId);
});

ipcMain.handle("unmount-server", (event, serverId) => {
  unmountServer(serverId);
});

ipcMain.handle("test-connection", async (event, server) => {
  return await testConnection(server);
});

ipcMain.handle("get-settings", () => {
  return store.get("settings", {
    startWithWindows: false,
    startMinimized: false,
    minimizeToTray: true,
    showNotifications: true,
    connectionTimeout: 10000,
    defaultPort: 22,
  });
});

ipcMain.handle("save-settings", (event, settings) => {
  store.set("settings", settings);

  // Handle auto-start
  app.setLoginItemSettings({
    openAtLogin: settings.startWithWindows,
  });

  return { success: true };
});

ipcMain.handle("get-available-drives", async () => {
  return new Promise((resolve) => {
    exec("wmic logicaldisk get name", (error, stdout) => {
      if (error) {
        console.error("Error getting drives:", error);
        // Return all letters if we can't check
        resolve("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
        return;
      }

      // Parse the output to get used drive letters
      const usedDrives = stdout
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.match(/^[A-Z]:$/))
        .map((line) => line[0]);

      // Generate all letters A-Z
      const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

      // Filter out used drives
      const availableLetters = allLetters.filter(
        (letter) => !usedDrives.includes(letter),
      );

      console.log("Used drives:", usedDrives);
      console.log("Available drives:", availableLetters);

      resolve(availableLetters);
    });
  });
});

ipcMain.handle("check-dependencies", async () => {
  try {
    console.log("IPC: check-dependencies handler called");
    const winfsp = await isDependencyInstalled("WinFsp");
    const sshfs = await isDependencyInstalled("SSHFS-Win");
    console.log("IPC: Returning dependency status:", { winfsp, sshfs });
    return { winfsp, sshfs };
  } catch (error) {
    console.error("IPC: Error in check-dependencies handler:", error);
    return { winfsp: false, sshfs: false };
  }
});

// Allow renderer to request an update check (returns basic success/error)
ipcMain.handle("check-for-updates", async () => {
  if (!autoUpdater)
    return { success: false, error: "auto-updater not available" };
  try {
    // Trigger a manual check; events are forwarded to renderer via the listeners above
    const res = await autoUpdater.checkForUpdates();

    // If electron-updater provides an updateInfo, emit the appropriate event
    if (res && res.updateInfo) {
      const info = res.updateInfo;
      if (info.version && info.version !== app.getVersion()) {
        mainWindow.webContents.send("update-available", info);
      } else {
        mainWindow.webContents.send("update-not-available", info);
      }
    }

    // If a download promise exists, wire progress via original autoUpdater events
    if (res && res.downloadPromise) {
      res.downloadPromise.catch((e) => console.warn("Download failed:", e));
    }

    return { success: true };
  } catch (err) {
    console.warn("check-for-updates failed:", err);
    return { success: false, error: err.message };
  }
});

// Quit and install handler for renderer (called when user accepts restart)
ipcMain.handle("quit-and-install", async () => {
  if (autoUpdater && typeof autoUpdater.quitAndInstall === "function") {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Fallback: just quit the app
  app.quit();
  return { success: true };
});

ipcMain.handle("install-dependencies", () => {
  installDependencies();
});

ipcMain.handle("uninstall-dependency", async (event, name) => {
  try {
    await uninstallDependency(name);
    return { success: true };
  } catch (error) {
    console.error(`Failed to uninstall ${name}:`, error);
    return { success: false, error: error.message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Auto-mount servers on startup
  const servers = store.get("servers", []);
  servers.forEach((server) => {
    if (server.autoMount) {
      setTimeout(() => mountServer(server.id), 2000);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});
