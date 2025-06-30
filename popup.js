document.addEventListener('DOMContentLoaded', async () => {
  const windowNumberEl = document.getElementById('windowNumber');
  const currentNameEl = document.getElementById('currentName');
  const nameInput = document.getElementById('nameInput');
  const saveButton = document.getElementById('saveButton');
  
  // Get current window info
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getWindowInfo' }, resolve);
  });
  
  if (response) {
    const { windowId, number, name, hasName } = response;
    
    windowNumberEl.textContent = `#${number}`;
    
    if (hasName) {
      currentNameEl.textContent = name;
      nameInput.value = name;
    } else {
      currentNameEl.textContent = "Unnamed";
      currentNameEl.classList.add('unnamed');
    }
    
    // Save name function
    async function saveName() {
      const newName = nameInput.value.trim();
      if (newName) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'setWindowName',
            windowId: windowId,
            name: newName
          }, resolve);
        });
        
        window.close();
      }
    }
    
    // Event listeners
    saveButton.addEventListener('click', saveName);
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });
    
    // Auto-select existing name for easy editing
    if (hasName) {
      nameInput.select();
    }
  }
});