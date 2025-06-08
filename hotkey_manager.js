// this is a hotkey manager for the application
// the user is able to add and remove event handlers for specific hotkeys
// the hotkeys are stored in a the local storage in
// a JSON format like shown in defalt.json
// json format: {"event_name": "single_key",...}

// scan for existing hotkeys in local storage
// if no hotkeys are found, save the default hotkeys

let DEFAULT_HOTKEYS = {};
const HOTKEYS_KEY = "hotkeys";
let hotkeys = {};
let recordingAction = null;
let pressedKeys = new Set();
let popupDiv = null;

// Load default hotkeys from default.json
async function loadDefaultHotkeys() {
    try {
        const response = await fetch('default.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        DEFAULT_HOTKEYS = await response.json();
    } catch (err) {
        alert("Could not load default hotkey file (default.json). Settings will not work correctly.\n\n" + err);
        DEFAULT_HOTKEYS = {};
    }
}

// Load hotkeys from localStorage or use default
function loadHotkeys() {
    try {
        const stored = localStorage.getItem(HOTKEYS_KEY);
        if (stored) {
            hotkeys = JSON.parse(stored);
        } else {
            hotkeys = { ...DEFAULT_HOTKEYS };
            localStorage.setItem(HOTKEYS_KEY, JSON.stringify(hotkeys));
        }
    } catch (err) {
        alert("Could not read hotkey settings from localStorage. Settings have been reset.\n\n" + err);
        hotkeys = { ...DEFAULT_HOTKEYS };
        localStorage.setItem(HOTKEYS_KEY, JSON.stringify(hotkeys));
    }
}

// Save hotkeys to localStorage
function saveHotkeys() {
    localStorage.setItem(HOTKEYS_KEY, JSON.stringify(hotkeys));
}

// Update label when key is triggered
function updateTriggerLabel(action, key) {
    const label = document.getElementById("trigger-label");
    label.textContent = `Action "${action}" triggered by key "${key}"`;
}

// List all currently pressed keys
function updatePressedKeysList() {
    const listDiv = document.getElementById("pressed-keys-list");
    if (pressedKeys.size === 0) {
        listDiv.textContent = "No keys pressed.";
    } else {
        listDiv.textContent = Array.from(pressedKeys).join(", ");
    }
}

// Show popup to prompt user for key
function showKeyPrompt(action) {
    if (popupDiv) return; // Prevent multiple popups

    popupDiv = document.createElement("div");
    popupDiv.style.position = "fixed";
    popupDiv.style.top = "0";
    popupDiv.style.left = "0";
    popupDiv.style.width = "100vw";
    popupDiv.style.height = "100vh";
    popupDiv.style.background = "rgba(24,26,32,0.85)";
    popupDiv.style.display = "flex";
    popupDiv.style.alignItems = "center";
    popupDiv.style.justifyContent = "center";
    popupDiv.style.zIndex = "1000";

    const inner = document.createElement("div");
    inner.style.background = "#23242a";
    inner.style.color = "#e0e0e0";
    inner.style.padding = "32px 48px";
    inner.style.borderRadius = "8px";
    inner.style.boxShadow = "0 2px 16px #000a";
    inner.style.fontSize = "1.2em";
    inner.textContent = `Press a key to rebind "${action}"`;

    popupDiv.appendChild(inner);
    document.body.appendChild(popupDiv);
}

// Hide the popup
function hideKeyPrompt() {
    if (popupDiv) {
        document.body.removeChild(popupDiv);
        popupDiv = null;
    }
}

// Handle keydown events
document.addEventListener("keydown", (e) => {
    if (recordingAction) {
        e.preventDefault(); // Prevent default when rebinding
        hotkeys[recordingAction] = e.key.toLowerCase();
        saveHotkeys();
        renderHotkeyList();
        recordingAction = null;
        document.body.style.cursor = "";
        hideKeyPrompt();
        return;
    }
    // Prevent default if key is a registered hotkey
    for (const key of Object.values(hotkeys)) {
        if (e.key.toLowerCase() === key.toLowerCase()) {
            e.preventDefault();
            break;
        }
    }
    pressedKeys.add(e.key);
    updatePressedKeysList();
    for (const [action, key] of Object.entries(hotkeys)) {
        if (e.key.toLowerCase() === key.toLowerCase()) {
            updateTriggerLabel(action, e.key);
            break;
        }
    }
});

// Handle keyup events to update pressed keys list
document.addEventListener("keyup", (e) => {
    pressedKeys.delete(e.key);
    updatePressedKeysList();
});

// Render hotkey settings list
function renderHotkeyList() {
    const list = document.getElementById("hotkey-list");
    list.innerHTML = "";
    for (const action of Object.keys(DEFAULT_HOTKEYS)) {
        const li = document.createElement("li");
        li.textContent = `${action}: ${hotkeys[action] || ""} `;
        const btn = document.createElement("button");
        btn.textContent = "Record New Key";
        btn.onclick = () => {
            recordingAction = action;
            document.body.style.cursor = "crosshair";
            showKeyPrompt(action);
        };
        li.appendChild(btn);
        list.appendChild(li);
    }
}

// Reset hotkeys to default
function resetHotkeys() {
    hotkeys = { ...DEFAULT_HOTKEYS };
    saveHotkeys();
    renderHotkeyList();
}

// Settings open/close
document.addEventListener("DOMContentLoaded", async () => {
    await loadDefaultHotkeys();
    loadHotkeys();
    renderHotkeyList();
    updatePressedKeysList();

    document.getElementById("open-settings").onclick = () => {
        document.getElementById("settings").style.display = "block";
        document.getElementById("open-settings").style.display = "none";
    };
    document.getElementById("close-settings").onclick = () => {
        document.getElementById("settings").style.display = "none";
        document.getElementById("open-settings").style.display = "";
    };

    // Add this handler for the reset button
    document.getElementById("reset-hotkeys").onclick = () => {
        if (confirm("Are you sure you want to reset all hotkeys to default?")) {
            resetHotkeys();
        }
    };
});


