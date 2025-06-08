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

// List all currently pressed keys
function updateTriggeredActionsList() {
    const listDiv = document.getElementById("pressed-keys-list");
    // Find all actions whose hotkey is currently pressed
    const triggeredActions = [];
    for (const [action, key] of Object.entries(hotkeys)) {
        if (pressedKeys.has(key)) {
            triggeredActions.push({ action, key });
        }
    }
    listDiv.innerHTML = "";
    if (triggeredActions.length === 0) {
        // Show nothing if no actions are triggered
        return;
    }
    for (const { action, key } of triggeredActions) {
        const box = document.createElement("div");
        box.style.background = "#23242a";
        box.style.color = "#e0e0e0";
        box.style.padding = "16px 24px";
        box.style.margin = "8px 0";
        box.style.borderRadius = "8px";
        box.style.boxShadow = "0 2px 8px #000a";
        box.style.fontSize = "1.1em";
        box.textContent = `'${key.toUpperCase()}' → ${action}`;
        listDiv.appendChild(box);
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
document.addEventListener('keydown', function(event) {
    // Prevent hotkey triggers when focus is in an input, textarea, or contenteditable element
    const tag = event.target.tagName.toLowerCase();
    const isEditable = event.target.isContentEditable;
    if (tag === 'input' || tag === 'textarea' || isEditable) {
        return; // Do not trigger hotkeys
    }

    if (recordingAction) {
        event.preventDefault(); // Prevent default when rebinding
        hotkeys[recordingAction] = event.key.toLowerCase();
        saveHotkeys();
        renderHotkeyList();
        recordingAction = null;
        document.body.style.cursor = "";
        hideKeyPrompt();
        return;
    }
    // Prevent default if key is a registered hotkey
    for (const key of Object.values(hotkeys)) {
        if (event.key.toLowerCase() === key.toLowerCase()) {
            event.preventDefault();
            break;
        }
    }
    pressedKeys.add(event.key.toLowerCase());
    updateTriggeredActionsList();
});

// Handle keyup events to update pressed keys list
document.addEventListener("keyup", (e) => {
    pressedKeys.delete(e.key.toLowerCase());
    updateTriggeredActionsList();
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
    updateTriggeredActionsList();

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


