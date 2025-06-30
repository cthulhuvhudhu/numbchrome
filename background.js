// // Track window creation and assign numbers
// chrome.windows.onCreated.addListener(async (window) => {
//   console.log('New window created:', window.id);
  
//   // Get current window data
//   const result = await chrome.storage.local.get(['windowData', 'nextNumber']);
//   const windowData = result.windowData || {};
//   const nextNumber = result.nextNumber || 1;
  
//   // Only number normal windows (not popups, apps, etc.)
//   if (window.type === 'normal') {
//     windowData[window.id] = {
//       number: nextNumber,
//       name: null, // null means not named yet
//       created: Date.now()
//     };
    
//     await chrome.storage.local.set({
//       windowData: windowData,
//       nextNumber: nextNumber + 1
//     });
    
//     console.log(`Window ${window.id} assigned number ${nextNumber}`);
//   }
// });

// // Clean up when windows are closed
// chrome.windows.onRemoved.addListener(async (windowId) => {
//   const result = await chrome.storage.local.get(['windowData']);
//   const windowData = result.windowData || {};
  
//   delete windowData[windowId];
//   await chrome.storage.local.set({ windowData });
  
//   console.log(`Window ${windowId} removed from storage`);
// });

// // Handle messages from popup and content scripts
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'getWindowInfo') {
//     chrome.windows.getCurrent().then(async (currentWindow) => {
//       const result = await chrome.storage.local.get(['windowData']);
//       const windowData = result.windowData || {};
//       const info = windowData[currentWindow.id];
      
//       sendResponse({
//         windowId: currentWindow.id,
//         number: info?.number || 1,
//         name: info?.name,
//         hasName: !!info?.name
//       });
//     });
//     return true; // Keep message channel open
    
//   } else if (request.action === 'setWindowName') {
//     chrome.storage.local.get(['windowData']).then(async (result) => {
//       const windowData = result.windowData || {};
      
//       if (windowData[request.windowId]) {
//         windowData[request.windowId].name = request.name;
//         await chrome.storage.local.set({ windowData });
        
//         // Notify all tabs in this window to update their labels
//         const tabs = await chrome.tabs.query({ windowId: request.windowId });
//         tabs.forEach(tab => {
//           chrome.tabs.sendMessage(tab.id, { 
//             action: 'updateLabel'
//           }).catch(() => {}); // Ignore errors for pages that can't receive messages
//         });
//       }
      
//       sendResponse({ success: true });
//     });
//     return true; // Keep message channel open
//   }
// });

// // Initialize existing windows on extension startup
// chrome.runtime.onStartup.addListener(async () => {
//   const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
//   const result = await chrome.storage.local.get(['windowData', 'nextNumber']);
//   let windowData = result.windowData || {};
//   let nextNumber = result.nextNumber || 1;
  
//   // Assign numbers to any unnumbered windows
//   for (const window of windows) {
//     if (!windowData[window.id]) {
//       windowData[window.id] = {
//         number: nextNumber,
//         name: null,
//         created: Date.now()
//       };
//       nextNumber++;
//     }
//   }
  
//   await chrome.storage.local.set({ windowData, nextNumber });
// });

// chrome.runtime.onInstalled.addListener(async () => {
//   // Same logic as onStartup
//   const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
//   const result = await chrome.storage.local.get(['windowData', 'nextNumber']);
//   let windowData = result.windowData || {};
//   let nextNumber = result.nextNumber || 1;
  
//   for (const window of windows) {
//     if (!windowData[window.id]) {
//       windowData[window.id] = {
//         number: nextNumber,
//         name: null,
//         created: Date.now()
//       };
//       nextNumber++;
//     }
//   }
  
//   await chrome.storage.local.set({ windowData, nextNumber });
// });

// Track window creation and assign numbers
chrome.windows.onCreated.addListener(async (window) => {
  console.log('New window created:', window.id);
  
  if (window.type === 'normal') {
    const result = await chrome.storage.local.get(['windowData']);
    const windowData = result.windowData || {};
    
    // Find the lowest unused number
    const usedNumbers = Object.values(windowData).map(w => w.number);
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    windowData[window.id] = {
      number: nextNumber,
      name: null,
      created: Date.now()
    };
    
    await chrome.storage.local.set({ windowData });
    console.log(`Window ${window.id} assigned number ${nextNumber}`);
  }
});

// Clean up when windows are closed
chrome.windows.onRemoved.addListener(async (windowId) => {
  const result = await chrome.storage.local.get(['windowData']);
  const windowData = result.windowData || {};
  
  delete windowData[windowId];
  await chrome.storage.local.set({ windowData });
  
  console.log(`Window ${windowId} removed from storage`);
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getWindowInfo') {
    chrome.windows.getCurrent().then(async (currentWindow) => {
      const result = await chrome.storage.local.get(['windowData']);
      const windowData = result.windowData || {};
      const info = windowData[currentWindow.id];
      
      sendResponse({
        windowId: currentWindow.id,
        number: info?.number || 1,
        name: info?.name,
        hasName: !!info?.name
      });
    });
    return true;
    
  } else if (request.action === 'setWindowName') {
    chrome.storage.local.get(['windowData']).then(async (result) => {
      const windowData = result.windowData || {};
      
      if (windowData[request.windowId]) {
        windowData[request.windowId].name = request.name;
        await chrome.storage.local.set({ windowData });
        
        const tabs = await chrome.tabs.query({ windowId: request.windowId });
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'updateLabel'
          }).catch(() => {});
        });
      }
      
      sendResponse({ success: true });
    });
    return true;
  }
});

// Initialize existing windows on extension startup
async function initializeWindows() {
  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
  const result = await chrome.storage.local.get(['windowData']);
  let windowData = result.windowData || {};
  
  // Get all existing window IDs to clean up orphaned data
  const currentWindowIds = windows.map(w => w.id);
  
  // Remove data for windows that no longer exist
  Object.keys(windowData).forEach(windowId => {
    if (!currentWindowIds.includes(parseInt(windowId))) {
      delete windowData[parseInt(windowId)];
    }
  });
  
  // Assign numbers to any unnumbered windows
  for (const window of windows) {
    if (!windowData[window.id]) {
      // Find lowest unused number
      const usedNumbers = Object.values(windowData).map(w => w.number);
      let nextNumber = 1;
      while (usedNumbers.includes(nextNumber)) {
        nextNumber++;
      }
      
      windowData[window.id] = {
        number: nextNumber,
        name: null,
        created: Date.now()
      };
    }
  }
  
  await chrome.storage.local.set({ windowData });
}

chrome.runtime.onStartup.addListener(initializeWindows);
chrome.runtime.onInstalled.addListener(initializeWindows);