// Popup script for managing window names
document.addEventListener('DOMContentLoaded', async () => {
  const windowNumberEl = document.getElementById('windowNumber');
  const windowNameEl = document.getElementById('windowName');
  const nameInput = document.getElementById('nameInput');
  const renameButton = document.getElementById('renameButton');
  
  // Get current window info
  const windowResponse = await chrome.runtime.sendMessage({ action: 'getCurrentWindow' });
  const currentWindowId = windowResponse.windowId;
  
  const labelsResponse = await chrome.runtime.sendMessage({ action: 'getWindowLabels' });
  const labels = labelsResponse.labels;
  
  if (labels[currentWindowId]) {
    const { number, name } = labels[currentWindowId];
    windowNumberEl.textContent = `#${number}`;
    windowNameEl.textContent = name;
    nameInput.value = name;
  }
  
  // Handle rename button click
  renameButton.addEventListener('click', async () => {
    const newName = nameInput.value.trim();
    if (newName) {
      await chrome.runtime.sendMessage({
        action: 'updateWindowName',
        windowId: currentWindowId,
        name: newName
      });
      
      windowNameEl.textContent = newName;
      window.close();
    }
  });
  
  // Handle Enter key in input
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      renameButton.click();
    }
  });
  
  // Focus input for quick editing
  nameInput.focus();
  nameInput.select();
});