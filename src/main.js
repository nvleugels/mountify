// State management
let servers = [];
let settings = {};
let currentEditingServer = null;
let availableDrives = []; // Cache for available drive letters

// Initialize app
async function init() {
  console.log("Initializing app...");
  setupEventListeners();
  setupIPCListeners();
  await loadServers();
  await loadSettings();
  await refreshAvailableDrives(); // Load drives on startup
  console.log("Checking dependencies...");
  await checkDependencies();
  console.log("Init complete");
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.getElementById("nav-servers").addEventListener("click", () => {
    showView("servers");
  });

  document.getElementById("nav-settings").addEventListener("click", () => {
    showView("settings");
  });

  // Server management
  document.getElementById("btn-add-server").addEventListener("click", () => {
    openServerForm();
  });

  document
    .getElementById("btn-back-to-servers")
    .addEventListener("click", closeServerForm);
  document
    .getElementById("btn-cancel")
    .addEventListener("click", closeServerForm);

  document
    .getElementById("server-form")
    .addEventListener("submit", handleServerSubmit);
  document
    .getElementById("btn-test-connection")
    .addEventListener("click", handleTestConnection);
  document
    .getElementById("btn-delete-server")
    .addEventListener("click", handleDeleteServerFromForm);

  // Settings
  document
    .getElementById("btn-save-settings")
    .addEventListener("click", handleSaveSettings);

  // Dependency uninstall
  document
    .getElementById("btn-uninstall-winfsp")
    .addEventListener("click", () => handleUninstallDependency("WinFsp"));
  document
    .getElementById("btn-uninstall-sshfs")
    .addEventListener("click", () => handleUninstallDependency("SSHFS-Win"));
  document
    .getElementById("btn-install-deps")
    .addEventListener("click", handleInstallDeps);
}

// Setup IPC listeners
function setupIPCListeners() {
  window.electronAPI.onServersUpdated((updatedServers) => {
    console.log(
      "onServersUpdated event received:",
      updatedServers.length,
      "servers",
    );
    servers = updatedServers;
    renderServers();
  });

  window.electronAPI.onMountResult((result) => {
    if (result.success) {
      showToast("Success", "Server mounted successfully", "success");
    } else {
      showToast("Error", `Failed to mount: ${result.error}`, "error");
    }
    loadServers();
  });

  window.electronAPI.onUnmountResult((result) => {
    if (result.success) {
      showToast("Success", "Server unmounted successfully", "success");
    } else {
      showToast("Error", `Failed to unmount: ${result.error}`, "error");
    }
    loadServers();
  });

  window.electronAPI.onDependencyStatus((status) => {
    const winfspStatus = document.getElementById("winfsp-status");
    const sshfsStatus = document.getElementById("sshfs-status");

    if (status.status === "downloading" || status.status === "installing") {
      // Update the status message
      if (status.message.includes("WinFsp")) {
        winfspStatus.textContent = status.message;
      } else if (status.message.includes("SSHFS")) {
        sshfsStatus.textContent = status.message;
      }
      showToast("Info", status.message, "info");
    } else if (status.status === "uninstalling") {
      // Show uninstall progress
      if (status.message.includes("WinFsp")) {
        winfspStatus.textContent = "Uninstalling...";
      } else if (status.message.includes("SSHFS")) {
        sshfsStatus.textContent = "Uninstalling...";
      }
      showToast("Info", status.message, "info");
    } else if (
      status.status === "complete" ||
      status.status === "uninstall-complete"
    ) {
      showToast("Success", status.message, "success");
      // Auto-refresh dependency status after a short delay
      setTimeout(() => checkDependencies(), 1000);
    } else if (status.status === "error") {
      showToast("Error", status.message, "error");
      checkDependencies();
    }
  });
}

// View management
function showView(view) {
  const serversView = document.getElementById("servers-view");
  const settingsView = document.getElementById("settings-view");
  const serverFormView = document.getElementById("server-form-view");
  const navServers = document.getElementById("nav-servers");
  const navSettings = document.getElementById("nav-settings");

  // Hide all views
  serversView.classList.add("hidden");
  settingsView.classList.add("hidden");
  serverFormView.classList.add("hidden");

  // Inactive nav button styles
  const inactiveClasses = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
  const activeClasses = "text-primary-700 bg-primary-100 hover:bg-primary-100";

  // Reset both nav buttons to inactive
  navServers.className = `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${inactiveClasses}`;
  navSettings.className = `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${inactiveClasses}`;

  // Show the selected view and update nav
  if (view === "servers") {
    serversView.classList.remove("hidden");
    navServers.className = `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeClasses}`;
    // Refresh available drives when viewing servers
    refreshAvailableDrives();
  } else if (view === "settings") {
    settingsView.classList.remove("hidden");
    navSettings.className = `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeClasses}`;
  } else if (view === "server-form") {
    serverFormView.classList.remove("hidden");
    // No nav highlight for form view
  }
}

// Load servers
async function loadServers() {
  servers = await window.electronAPI.getServers();
  console.log("Loaded servers:", servers);
  renderServers();
}

// Render servers
function renderServers() {
  console.log("renderServers called with", servers.length, "servers");
  const serversList = document.getElementById("servers-list");
  const emptyState = document.getElementById("empty-state");

  if (servers.length === 0) {
    serversList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  serversList.innerHTML = servers
    .map(
      (server) => `
    <li class="flex items-center justify-between gap-x-6 px-6 py-5 ${server.isMounted ? "bg-green-50" : ""}" data-server-id="${server.id}">
      <div class="min-w-0 flex-1">
        <div class="flex items-start gap-x-3">
          <p class="text-sm/6 font-semibold text-gray-900">${escapeHtml(server.name)}</p>
          <span class="mt-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${server.isMounted ? "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20" : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/10"}">
            ${server.isMounted ? "Connected" : "Disconnected"}
          </span>
          ${
            server.autoMount
              ? `<span class="mt-0.5 inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              Auto
            </span>`
              : ""
          }
        </div>
        <div class="mt-1 flex items-center gap-x-3 text-xs/5 text-gray-500">
          <div class="flex items-center gap-x-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <span>${server.driveLetter}:</span>
          </div>
          ${
            server.remotePath && server.remotePath !== "/"
              ? `
          <div class="flex items-center gap-x-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span class="truncate">${escapeHtml(server.remotePath)}</span>
          </div>
          `
              : ""
          }
          ${
            server.driveLabel
              ? `
          <div class="flex items-center gap-x-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <span class="truncate">${escapeHtml(server.driveLabel)}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>
      <div class="flex flex-none items-center gap-x-4">
        <button class="btn-mount rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold ${server.isMounted ? "text-red-900 ring-1 ring-inset ring-red-300 hover:bg-red-50" : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"}" data-server-id="${server.id}" data-mounted="${server.isMounted}">
          ${server.isMounted ? "Unmount" : "Mount"}
        </button>
        <div class="relative flex-none">
          <button type="button" class="btn-menu block p-2.5 -m-2.5 text-gray-500 hover:text-gray-900" data-server-id="${server.id}">
            <span class="sr-only">Open options</span>
            <svg viewBox="0 0 20 20" fill="currentColor" class="size-5">
              <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
            </svg>
          </button>
          <div class="server-menu hidden absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5" data-server-id="${server.id}">
            <button class="btn-edit block w-full text-left px-3 py-1 text-sm/6 text-gray-900 hover:bg-gray-50" data-server-id="${server.id}">Edit</button>
            <button class="btn-delete block w-full text-left px-3 py-1 text-sm/6 text-red-600 hover:bg-gray-50" data-server-id="${server.id}">Delete</button>
          </div>
        </div>
      </div>
    </li>
  `,
    )
    .join("");

  // Add event listeners for mount buttons
  document.querySelectorAll(".btn-mount").forEach((btn) => {
    btn.addEventListener("click", handleToggleMount);
  });

  // Add event listeners for menu buttons
  document.querySelectorAll(".btn-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const serverId = e.currentTarget.getAttribute("data-server-id");
      const menu = document.querySelector(
        `.server-menu[data-server-id="${serverId}"]`,
      );

      // Close all other menus
      document.querySelectorAll(".server-menu").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
      });

      // Toggle this menu
      menu.classList.toggle("hidden");
    });
  });

  // Close menus when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".btn-menu") && !e.target.closest(".server-menu")) {
      document
        .querySelectorAll(".server-menu")
        .forEach((m) => m.classList.add("hidden"));
    }
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", handleEditServer);
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", handleDeleteServer);
  });
}

// Refresh available drive letters
async function refreshAvailableDrives() {
  try {
    availableDrives = await window.electronAPI.getAvailableDrives();
    console.log("Available drives refreshed:", availableDrives);
  } catch (error) {
    console.error("Error refreshing drive letters:", error);
    // Fallback to common letters if there's an error
    availableDrives = "STUVWXYZ".split("");
  }
}

// Populate drive letters dropdown from cache
function populateDriveLetters(currentDrive = null) {
  const driveSelect = document.getElementById("server-drive");

  // Use cached drives or fallback
  const availableLetters =
    availableDrives.length > 0 ? availableDrives : "STUVWXYZ".split("");

  // Clear existing options
  driveSelect.innerHTML = "";

  // If editing a server, include its current drive even if it's in use
  let lettersToShow = [...availableLetters];
  if (currentDrive && !availableLetters.includes(currentDrive)) {
    lettersToShow.push(currentDrive);
    lettersToShow.sort();
  }

  // Add options
  lettersToShow.forEach((letter) => {
    const option = document.createElement("option");
    option.value = letter;
    option.textContent = `${letter}:`;
    driveSelect.appendChild(option);
  });

  // Set the current drive if provided
  if (currentDrive && lettersToShow.includes(currentDrive)) {
    driveSelect.value = currentDrive;
  } else if (lettersToShow.length > 0) {
    // Default to first available
    driveSelect.value = lettersToShow[0];
  }
}

// Server form
function openServerForm(server = null) {
  currentEditingServer = server;
  const title = document.getElementById("form-title");
  const form = document.getElementById("server-form");
  const deleteBtn = document.getElementById("btn-delete-server");

  title.textContent = server ? "Edit Server" : "Add Server";

  // Show/hide delete button
  if (server) {
    deleteBtn.classList.remove("hidden");
  } else {
    deleteBtn.classList.add("hidden");
  }

  // Populate available drive letters from cache
  populateDriveLetters(server?.driveLetter);

  if (server) {
    document.getElementById("server-id").value = server.id;
    document.getElementById("server-name").value = server.name;
    document.getElementById("server-host").value = server.host;
    document.getElementById("server-port").value = server.port;
    document.getElementById("server-username").value = server.username;
    document.getElementById("server-password").value = server.password || "";
    document.getElementById("server-drive").value = server.driveLetter || "S";
    document.getElementById("server-path").value = server.remotePath || "/";
    document.getElementById("server-label").value = server.driveLabel || "";
    document.getElementById("server-automount").checked =
      server.autoMount || false;
  } else {
    form.reset();
    document.getElementById("server-port").value = settings.defaultPort || 22;
  }

  showView("server-form");
  document.getElementById("test-result").classList.add("hidden");
}

function closeServerForm() {
  showView("servers");
  document.getElementById("server-form").reset();
  currentEditingServer = null;
}

// Handle server submit
async function handleServerSubmit(e) {
  e.preventDefault();

  const server = {
    id: document.getElementById("server-id").value || null,
    name: document.getElementById("server-name").value,
    host: document.getElementById("server-host").value,
    port: parseInt(document.getElementById("server-port").value),
    username: document.getElementById("server-username").value,
    password: document.getElementById("server-password").value,
    driveLetter: document.getElementById("server-drive").value,
    remotePath: document.getElementById("server-path").value,
    driveLabel: document.getElementById("server-label").value,
    autoMount: document.getElementById("server-automount").checked,
  };

  const result = await window.electronAPI.saveServer(server);

  if (result.success) {
    showToast("Success", "Server saved successfully", "success");
    await loadServers(); // Load servers first
    closeServerForm(); // Then close form and switch view
  } else {
    showToast("Error", "Failed to save server", "error");
  }
}

// Handle test connection
async function handleTestConnection() {
  const server = {
    host: document.getElementById("server-host").value,
    port: parseInt(document.getElementById("server-port").value),
    username: document.getElementById("server-username").value,
    password: document.getElementById("server-password").value,
  };

  const resultDiv = document.getElementById("test-result");
  resultDiv.textContent = "Testing connection...";
  resultDiv.className = "mt-4 p-3 rounded-lg bg-blue-50 text-blue-700";
  resultDiv.classList.remove("hidden");

  const result = await window.electronAPI.testConnection(server);

  if (result.success) {
    resultDiv.textContent = "✓ Connection successful!";
    resultDiv.className = "mt-4 p-3 rounded-lg bg-green-50 text-green-700";
  } else {
    resultDiv.textContent = `✗ Connection failed: ${result.error}`;
    resultDiv.className = "mt-4 p-3 rounded-lg bg-red-50 text-red-700";
  }
}

// Handle toggle mount
async function handleToggleMount(e) {
  const button = e.currentTarget;
  const serverId = button.getAttribute("data-server-id");
  const isMounted = button.getAttribute("data-mounted") === "true";

  // Disable button and show loading state
  button.disabled = true;
  const originalText = button.textContent;
  button.innerHTML =
    '<svg class="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  try {
    if (isMounted) {
      await window.electronAPI.unmountServer(serverId);
    } else {
      await window.electronAPI.mountServer(serverId);
    }
  } finally {
    // Button will be re-rendered by loadServers() in the mount/unmount result handler
  }
}

// Handle edit server
function handleEditServer(e) {
  const serverId = e.currentTarget.getAttribute("data-server-id");
  const server = servers.find((s) => s.id === serverId);
  if (server) {
    openServerForm(server);
  }
}

// Handle delete server
async function handleDeleteServer(e) {
  const serverId = e.currentTarget.getAttribute("data-server-id");
  const server = servers.find((s) => s.id === serverId);

  if (!server) return;

  if (confirm(`Are you sure you want to delete "${server.name}"?`)) {
    const result = await window.electronAPI.deleteServer(serverId);
    if (result.success) {
      showToast("Success", "Server deleted successfully", "success");
      loadServers();
    }
  }
}

// Handle delete server from form
async function handleDeleteServerFromForm() {
  if (!currentEditingServer) return;

  if (
    confirm(`Are you sure you want to delete "${currentEditingServer.name}"?`)
  ) {
    const result = await window.electronAPI.deleteServer(
      currentEditingServer.id,
    );
    if (result.success) {
      showToast("Success", "Server deleted successfully", "success");
      closeServerForm();
      loadServers();
    }
  }
}

// Settings management
async function loadSettings() {
  settings = await window.electronAPI.getSettings();

  document.getElementById("setting-autostart").checked =
    settings.startWithWindows || false;
  document.getElementById("setting-start-minimized").checked =
    settings.startMinimized || false;
  document.getElementById("setting-tray").checked =
    settings.minimizeToTray !== false;
  document.getElementById("setting-notifications").checked =
    settings.showNotifications !== false;
  document.getElementById("setting-timeout").value =
    (settings.connectionTimeout || 10000) / 1000;
  document.getElementById("setting-port").value = settings.defaultPort || 22;
}

async function handleSaveSettings() {
  const newSettings = {
    startWithWindows: document.getElementById("setting-autostart").checked,
    startMinimized: document.getElementById("setting-start-minimized").checked,
    minimizeToTray: document.getElementById("setting-tray").checked,
    showNotifications: document.getElementById("setting-notifications").checked,
    connectionTimeout:
      parseInt(document.getElementById("setting-timeout").value) * 1000,
    defaultPort: parseInt(document.getElementById("setting-port").value),
  };

  const result = await window.electronAPI.saveSettings(newSettings);

  if (result.success) {
    settings = newSettings;
    showToast("Success", "Settings saved successfully", "success");
  } else {
    showToast("Error", "Failed to save settings", "error");
  }
}

// Dependencies
async function checkDependencies() {
  console.log("checkDependencies called in renderer");
  console.log("window.electronAPI:", window.electronAPI);

  if (!window.electronAPI) {
    console.error("electronAPI is not available!");
    return;
  }

  try {
    console.log("Calling electronAPI.checkDependencies()...");
    const deps = await window.electronAPI.checkDependencies();
    console.log("Dependency status received:", deps);

    const winfspBadge = document.getElementById("winfsp-badge");
    const sshfsBadge = document.getElementById("sshfs-badge");
    const winfspStatus = document.getElementById("winfsp-status");
    const sshfsStatus = document.getElementById("sshfs-status");
    const winfspUninstallBtn = document.getElementById("btn-uninstall-winfsp");
    const sshfsUninstallBtn = document.getElementById("btn-uninstall-sshfs");
    const installDepsBtn = document.getElementById("btn-install-deps");

    if (deps.winfsp) {
      winfspBadge.textContent = "Installed";
      winfspBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
      winfspStatus.textContent = "Windows File System Proxy";
      winfspUninstallBtn.classList.remove("hidden");
    } else {
      winfspBadge.textContent = "Not Installed";
      winfspBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
      winfspStatus.textContent = "Required for mounting drives";
      winfspUninstallBtn.classList.add("hidden");
    }

    if (deps.sshfs) {
      sshfsBadge.textContent = "Installed";
      sshfsBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
      sshfsStatus.textContent = "SFTP client for Windows";
      sshfsUninstallBtn.classList.remove("hidden");
    } else {
      sshfsBadge.textContent = "Not Installed";
      sshfsBadge.className =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
      sshfsStatus.textContent = "Required for SFTP connections";
      sshfsUninstallBtn.classList.add("hidden");
    }

    // Hide the "Install Dependencies" button when both dependencies are installed
    if (installDepsBtn) {
      if (deps.winfsp && deps.sshfs) {
        installDepsBtn.classList.add("hidden");
      } else {
        installDepsBtn.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("Error checking dependencies:", error);
  }
}

async function handleInstallDeps() {
  await window.electronAPI.installDependencies();
}

async function handleUninstallDependency(name) {
  const confirmed = confirm(`Are you sure you want to uninstall ${name}?`);
  if (!confirmed) return;

  const result = await window.electronAPI.uninstallDependency(name);

  if (!result.success) {
    showToast("Error", `Failed to uninstall: ${result.error}`, "error");
  }
  // Success toast and status refresh handled by onDependencyStatus listener
}

// Toast notifications
function showToast(title, message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  const borderClass =
    type === "success"
      ? "border-l-green-500"
      : type === "error"
        ? "border-l-red-500"
        : "border-l-blue-500";

  toast.className = `bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${borderClass} p-4 min-w-[300px] max-w-md animate-slide-in`;
  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        ${
          type === "success"
            ? `
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `
            : type === "error"
              ? `
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `
              : `
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `
        }
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium text-gray-900">${escapeHtml(title)}</p>
        <p class="text-sm text-gray-600">${escapeHtml(message)}</p>
      </div>
      <button class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  const closeBtn = toast.querySelector("button");
  closeBtn.addEventListener("click", () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize app when DOM is ready
init();
