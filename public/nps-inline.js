/**
 * NPS Survey Inline Embed
 * This script embeds an NPS survey into a specified container on your website
 */
(function() {
  // Get survey parameters
  const surveyId = document.currentScript.getAttribute('data-survey-id');
  const containerId = document.currentScript.getAttribute('data-container');
  
  if (!surveyId) {
    console.error('NPS Inline Error: No survey ID provided');
    return;
  }
  
  if (!containerId) {
    console.error('NPS Inline Error: No container ID provided');
    return;
  }
  
  // Find the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`NPS Inline Error: Container with ID "${containerId}" not found`);
    return;
  }
  
  // Create iframe for the survey
  const iframe = document.createElement('iframe');
  iframe.src = `${window.location.origin}/survey/${surveyId}?embed=true`;
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.height = '300px';
  iframe.style.borderRadius = '12px';
  
  // Clear container and append iframe
  container.innerHTML = '';
  container.appendChild(iframe);
})();