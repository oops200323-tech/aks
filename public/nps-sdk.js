/**
 * NPS Widget SDK - Complete Implementation
 * This is the main SDK file that provides all widget functionality
 */
(function(window) {
  'use strict';

  // SDK Configuration
  var SDK_VERSION = '1.0.0';
  var DEFAULT_BASE_URL = 'https://melodic-melba-d65cd6.netlify.app';
  
  // Widget namespace
  window.NPSWidget = window.NPSWidget || {};

  /**
   * Universal Widget - Shows all published surveys
   */
  window.NPSWidget.loadUniversal = function(options) {
    options = options || {};
    var script = document.createElement('script');
    script.src = (options.baseUrl || DEFAULT_BASE_URL) + '/nps-universal.js';
    
    // Set attributes
    if (options.position) script.setAttribute('data-position', options.position);
    if (options.delay) script.setAttribute('data-delay', options.delay.toString());
    if (options.autoRotate !== undefined) script.setAttribute('data-auto-rotate', options.autoRotate.toString());
    if (options.showOnce !== undefined) script.setAttribute('data-show-once', options.showOnce.toString());
    
    document.head.appendChild(script);
    return script;
  };

  /**
   * Specific Survey Widget
   */
  window.NPSWidget.loadSurvey = function(surveyId, options) {
    if (!surveyId) {
      console.error('NPSWidget: Survey ID is required');
      return;
    }
    
    options = options || {};
    var script = document.createElement('script');
    script.src = (options.baseUrl || DEFAULT_BASE_URL) + '/nps-widget.js';
    
    script.setAttribute('data-survey-id', surveyId);
    if (options.position) script.setAttribute('data-position', options.position);
    if (options.delay) script.setAttribute('data-delay', options.delay.toString());
    
    document.head.appendChild(script);
    return script;
  };

  /**
   * Inline Embed
   */
  window.NPSWidget.loadInline = function(surveyId, containerId, options) {
    if (!surveyId || !containerId) {
      console.error('NPSWidget: Survey ID and container ID are required');
      return;
    }
    
    options = options || {};
    var script = document.createElement('script');
    script.src = (options.baseUrl || DEFAULT_BASE_URL) + '/nps-inline.js';
    
    script.setAttribute('data-survey-id', surveyId);
    script.setAttribute('data-container', containerId);
    
    document.head.appendChild(script);
    return script;
  };

  /**
   * Direct Survey Link
   */
  window.NPSWidget.getSurveyUrl = function(surveyId, options) {
    options = options || {};
    var baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    var url = baseUrl + '/s/' + surveyId;
    
    if (options.embed) url += '?embed=true';
    return url;
  };

  /**
   * Check if surveys are available
   */
  window.NPSWidget.checkSurveys = function(callback, options) {
    options = options || {};
    var baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    
    fetch(baseUrl + '/functions/v1/published-surveys', {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      callback(null, data.surveys || []);
    })
    .catch(function(error) {
      callback(error, []);
    });
  };

  /**
   * Remove all widgets
   */
  window.NPSWidget.removeAll = function() {
    // Remove widget containers
    var widgets = document.querySelectorAll('#nps-widget-container, #nps-universal-widget, [id^="nps-survey-"]');
    widgets.forEach(function(widget) {
      if (widget.parentNode) {
        widget.parentNode.removeChild(widget);
      }
    });
    
    // Remove scripts
    var scripts = document.querySelectorAll('script[src*="nps-"]');
    scripts.forEach(function(script) {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
  };

  // Auto-initialization from script attributes
  (function() {
    var currentScript = document.currentScript;
    if (!currentScript) return;
    
    var autoLoad = currentScript.getAttribute('data-auto-load');
    if (autoLoad === 'universal') {
      window.NPSWidget.loadUniversal({
        position: currentScript.getAttribute('data-position'),
        delay: parseInt(currentScript.getAttribute('data-delay')) || 5000,
        autoRotate: currentScript.getAttribute('data-auto-rotate') !== 'false',
        showOnce: currentScript.getAttribute('data-show-once') === 'true'
      });
    }
  })();

  console.log('NPS Widget SDK v' + SDK_VERSION + ' loaded');

})(window);