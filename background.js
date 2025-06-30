// Service worker for managing window creation and storage
let windowCounter = 1;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Get existing windows and assign numbers
  const windows = await chrome.windows.getAll();
  const stored = await chrome.storage.local.get(['windowLabels', 'nextCounter']);
  
  if (!stored.windowLabels) {
    const windowLabels = {};
    windows.forEach((window, index) => {
      windowLabels[window.id] = {
        number: index + 1,
        name: `Window ${index + 1}`
      };
    });
    await chrome.storage.local.set({ 
      windowLabels,
      nextCounter: windows.length + 1
    });
  } else {
    windowCounter = stored.nextCounter || windows.length + 1;
  }
  
  // Update all existing windows
  updateAllWindows();
});

// Handle new window creation
chrome.windows.onCreated.addListener(async (window) => {
  const stored = await chrome.storage.local.get(['windowLabels', 'nextCounter']);
  const windowLabels = stored.windowLabels || {};
  
  windowCounter = stored.nextCounter || windowCounter;
  
  windowLabels[window.id] = {
    number: windowCounter,
    name: `Window ${windowCounter}`
  };
  
  await chrome.storage.local.set({ 
    windowLabels,
    nextCounter: windowCounter + 1
  });
  
  windowCounter++;
  updateWindow(window.id);
});

// Handle window removal
chrome.windows.onRemoved.addListener(async (windowId) => {
  const stored = await chrome.storage.local.get(['windowLabels']);
  const windowLabels = stored.windowLabels || {};
  
  delete windowLabels[windowId];
  await chrome.storage.local.set({ windowLabels });
});

// Function to update a specific window's label
async function updateWindow(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'updateLabel',
        windowId: windowId
      }).catch(() => {}); // Ignore errors for non-content script pages
    });
  } catch (error) {
    console.log('Error updating window:', error);
  }
}

// Function to update all windows
async function updateAllWindows() {
  try {
    const windows = await chrome.windows.getAll();
    windows.forEach(window => {
      updateWindow(window.id);
    });
  } catch (error) {
    console.log('Error updating all windows:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'updateWindowName') {
    const stored = await chrome.storage.local.get(['windowLabels']);
    const windowLabels = stored.windowLabels || {};
    
    if (windowLabels[request.windowId]) {
      windowLabels[request.windowId].name = request.name;
      await chrome.storage.local.set({ windowLabels });
      updateWindow(request.windowId);
    }
  } else if (request.action === 'getCurrentWindow') {
    const currentWindow = await chrome.windows.getCurrent();
    sendResponse({ windowId: currentWindow.id });
  } else if (request.action === 'getWindowLabels') {
    const stored = await chrome.storage.local.get(['windowLabels']);
    sendResponse({ labels: stored.windowLabels || {} });
  }
});