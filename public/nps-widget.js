/**
 * NPS Survey Popup Widget
 * This script creates a popup widget on your website that shows a specific NPS survey
 */
(function() {
  // Get survey parameters
  const surveyId = document.currentScript?.getAttribute('data-survey-id');
  const position = document.currentScript?.getAttribute('data-position') || 'bottom-right';
  const delay = parseInt(document.currentScript?.getAttribute('data-delay') || '3000');
  
  if (!surveyId) {
    console.error('NPS Widget Error: No survey ID provided');
    return;
  }
  
  // Check if already shown
  const STORAGE_KEY = `nps_survey_shown_${surveyId}`;
  if (localStorage.getItem(STORAGE_KEY)) {
    console.log('NPS Widget: Survey already shown to this user');
    return;
  }
  
  let widgetContainer = null;
  
  // Create widget container
  function createWidgetContainer() {
    if (widgetContainer) return;
    
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'nps-widget-container';
    widgetContainer.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: white;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      width: 400px;
      max-width: 90vw;
      height: 400px;
      max-height: 90vh;
      overflow: hidden;
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
      ${getPositionStyles()}
    `;
    
    // Create iframe for the survey
    const iframe = document.createElement('iframe');
    iframe.src = `${window.location.origin}/s/${surveyId}?embed=true&widget=true`;
    iframe.style.cssText = `
      border: none;
      width: 100%;
      height: 100%;
      border-radius: 12px;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      z-index: 10;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
    `;
    closeButton.onmouseover = () => closeButton.style.background = '#f3f4f6';
    closeButton.onmouseout = () => closeButton.style.background = 'none';
    closeButton.onclick = closeWidget;
    
    widgetContainer.appendChild(iframe);
    widgetContainer.appendChild(closeButton);
    document.body.appendChild(widgetContainer);
    
    // Animate in
    setTimeout(() => {
      if (widgetContainer) {
        widgetContainer.style.transform = 'translateY(0)';
      }
    }, 100);
    
    // Listen for close messages from iframe
    window.addEventListener('message', (event) => {
      if (event.data.type === 'close-widget') {
        closeWidget();
      }
    });
  }
  
  // Get position styles
  function getPositionStyles() {
    switch(position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      case 'center':
        return 'top: 50%; left: 50%; transform: translate(-50%, -50%) translateY(100%);';
      default:
        return 'bottom: 20px; right: 20px;';
    }
  }
  
  // Close widget
  function closeWidget() {
    if (widgetContainer) {
      widgetContainer.style.transform = position === 'center' 
        ? 'translate(-50%, -50%) scale(0.8)' 
        : 'translateY(100%)';
      widgetContainer.style.opacity = '0';
      
      setTimeout(() => {
        if (widgetContainer && widgetContainer.parentNode) {
          widgetContainer.parentNode.removeChild(widgetContainer);
        }
        widgetContainer = null;
      }, 300);
    }
    
    // Mark as shown
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }
  
  // Show widget after delay
  console.log('NPS Widget: Will show widget after', delay, 'ms');
  setTimeout(() => {
    console.log('NPS Widget: Showing widget for survey', surveyId);
    createWidgetContainer();
  }, delay);
})();