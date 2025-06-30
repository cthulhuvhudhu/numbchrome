// Service worker for managing window creation and storage
let windowCounter = 1;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
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
  
  // Update all existing windows after a short delay
  setTimeout(updateAllWindows, 500);
});

// Handle new window creation
chrome.windows.onCreated.addListener(async (window) => {
  console.log('New window created:', window.id);
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
  setTimeout(() => updateWindow(window.id), 1000);
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

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'updateWindowName') {
    chrome.storage.local.get(['windowLabels']).then(stored => {
      const windowLabels = stored.windowLabels || {};
      
      if (windowLabels[request.windowId]) {
        windowLabels[request.windowId].name = request.name;
        return chrome.storage.local.set({ windowLabels });
      }
    }).then(() => {
      updateWindow(request.windowId);
    });
    
  } else if (request.action === 'getCurrentWindow') {
    chrome.windows.getCurrent().then(currentWindow => {
      sendResponse({ windowId: currentWindow.id });
    });
    return true; // Keep message channel open for async response
    
  } else if (request.action === 'getWindowLabels') {
    chrome.storage.local.get(['windowLabels']).then(stored => {
      sendResponse({ labels: stored.windowLabels || {} });
    });
    return true; // Keep message channel open for async response
  }
});