let labelElement = null;
let promptElement = null;

async function createWindowLabel() {
  // Remove existing elements
  if (labelElement) labelElement.remove();
  if (promptElement) promptElement.remove();
  
  try {
    // Get window info from background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getWindowInfo' }, resolve);
    });
    
    if (!response) return;
    
    const { number, name, hasName } = response;
    
    // Create the label
    labelElement = document.createElement('div');
    labelElement.id = 'window-label-extension';
    
    if (hasName) {
      // Window is named - show clean label
      labelElement.innerHTML = `
        <div class="window-label-content">
          <span class="window-number">#${number}</span>
          <span class="window-name">${name}</span>
        </div>
      `;
    } else {
      // Window not named - show prompt
      labelElement.innerHTML = `
        <div class="window-label-content unnamed">
          <span class="window-number">#${number}</span>
          <span class="window-prompt">Click extension to name</span>
        </div>
      `;
      labelElement.classList.add('needs-naming');
    }
    
    document.body.appendChild(labelElement);
    
    // Make label draggable (after it's created)
    makeDraggable(labelElement);
    
  } catch (error) {
    console.log('Error creating label:', error);
  }
}

function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    element.style.transition = 'none';
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newX = startLeft + (e.clientX - startX);
    const newY = startTop + (e.clientY - startY);
    
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
    element.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.transition = 'all 0.3s ease';
      element.style.cursor = 'grab';
    }
  });
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateLabel') {
    createWindowLabel();
  }
});

// Create label when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createWindowLabel);
} else {
  createWindowLabel();
}

// Update label when page becomes visible (switching between windows)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(createWindowLabel, 100);
  }
});