// Content script to display window labels
let labelElement = null;

// Create and display window label
async function createWindowLabel() {
  if (labelElement) {
    labelElement.remove();
  }
  
  // Get current window ID and label
  const response = await chrome.runtime.sendMessage({ action: 'getCurrentWindow' });
  const windowId = response.windowId;
  
  const labelsResponse = await chrome.runtime.sendMessage({ action: 'getWindowLabels' });
  const labels = labelsResponse.labels;
  
  if (labels[windowId]) {
    const { number, name } = labels[windowId];
    
    labelElement = document.createElement('div');
    labelElement.id = 'window-label-extension';
    labelElement.innerHTML = `
      

        #${number}
        ${name}
      

    `;
    
    document.body.appendChild(labelElement);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateLabel') {
    createWindowLabel();
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createWindowLabel);
} else {
  createWindowLabel();
}
