// Content script to display window labels
let labelElement = null;

// Create and display window label
function createWindowLabel() {
  if (labelElement) {
    labelElement.remove();
  }
  
  labelElement = document.createElement('div');
  labelElement.id = 'window-label-extension';
  labelElement.innerHTML = `
    <div class="window-label-content">
      <span class="window-number">#1</span>
      <span class="window-name">Test Window</span>
    </div>
  `;
  
  document.body.appendChild(labelElement);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createWindowLabel);
} else {
  createWindowLabel();
}