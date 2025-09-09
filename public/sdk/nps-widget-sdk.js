/**
 * NPS Widget SDK v2.0.0
 * A comprehensive JavaScript SDK for integrating NPS surveys with advanced features
 */
(function(window) {
  'use strict';

  // SDK Configuration
  const SDK_VERSION = '2.0.0';
  const DEFAULT_BASE_URL = 'https://melodic-melba-d65cd6.netlify.app';
  
  // Default configuration
  const DEFAULT_CONFIG = {
    position: 'bottom-right',
    primaryColor: '#4F46E5',
    delay: 5000,
    showOnce: false,
    autoRotate: true,
    roundedCorners: true,
    closeButton: true,
    progressBar: true,
    autoFadeOut: true,
    fadeOutDelay: 3000,
    spaMode: false,
    urlTargeting: {
      enabled: false,
      mode: 'all',
      patterns: []
    }
  };

  /**
   * Main NPSWidget Class
   */
  class NPSWidget {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.widgetContainer = null;
      this.surveys = [];
      this.currentSurveyIndex = 0;
      this.isVisible = false;
      this.isLoading = false;
      this.destroyed = false;
      
      // Validate required config
      if (!this.config.apiKey) {
        this.handleError('API key is required', new Error('Missing API key'));
        return;
      }

      // Initialize
      this.init();
    }

    async init() {
      try {
        this.isLoading = true;
        
        // Load surveys
        await this.loadSurveys();
        
        // Check URL targeting
        if (!this.shouldShowOnCurrentUrl()) {
          return;
        }

        // Set up SPA mode if enabled
        if (this.config.spaMode) {
          this.setupSPAMode();
        }

        // Show widget after delay
        setTimeout(() => {
          if (!this.destroyed) {
            this.show();
          }
        }, this.config.delay);

      } catch (error) {
        this.handleError('Failed to initialize widget', error);
      } finally {
        this.isLoading = false;
      }
    }

    async loadSurveys() {
      try {
        const response = await this.makeRequest('/functions/v1/published-surveys');
        
        if (response.success && response.surveys) {
          this.surveys = response.surveys;
          console.log(`NPS Widget: Loaded ${this.surveys.length} surveys`);
        } else {
          throw new Error('No surveys found');
        }
      } catch (error) {
        console.warn('NPS Widget: Failed to load surveys, using fallback');
        this.surveys = this.getFallbackSurveys();
      }
    }

    async makeRequest(endpoint, options = {}) {
      // Use Netlify functions with proper endpoint mapping
      let netlifyEndpoint;
      if (endpoint.includes('published-surveys')) {
        netlifyEndpoint = '/.netlify/functions/published-surveys';
      } else if (endpoint.includes('submit-response')) {
        netlifyEndpoint = '/.netlify/functions/submit-response';
      } else if (endpoint.includes('validate-api-key')) {
        netlifyEndpoint = '/.netlify/functions/validate-api-key';
      } else {
        netlifyEndpoint = endpoint;
      }
      
      const url = `${DEFAULT_BASE_URL}${netlifyEndpoint}`;
      
      try {
        // Try standard fetch first
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
            'Authorization': `Bearer ${this.config.apiKey}`,
            'apikey': this.config.apiKey,
            'X-Widget-Version': SDK_VERSION,
            'X-Widget-Origin': window.location.origin,
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // If CORS fails, try JSONP fallback for GET requests
        if ((!options.method || options.method === 'GET') && error.message.includes('CORS')) {
          console.log('NPS Widget: CORS failed, trying JSONP fallback');
          return await this.makeJSONPRequest(url);
        }
        throw error;
      }
    }

    makeJSONPRequest(url) {
      return new Promise((resolve, reject) => {
        const callbackName = `npsCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const script = document.createElement('script');
        
        // Set up callback
        window[callbackName] = (data) => {
          cleanup();
          resolve(data);
        };

        // Cleanup function
        const cleanup = () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          delete window[callbackName];
        };

        // Set up timeout
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('JSONP request timeout'));
        }, 10000);

        // Handle script error
        script.onerror = () => {
          clearTimeout(timeout);
          cleanup();
          reject(new Error('JSONP request failed'));
        };

        // Make request
        const separator = url.includes('?') ? '&' : '?';
        script.src = `${url}${separator}callback=${callbackName}&_=${Date.now()}`;
        document.head.appendChild(script);
      });
    }

    shouldShowOnCurrentUrl() {
      if (!this.config.urlTargeting.enabled) {
        return true;
      }

      const currentUrl = window.location.href;
      const { mode, patterns } = this.config.urlTargeting;

      if (mode === 'all') {
        return true;
      }

      const matches = patterns.some(pattern => {
        switch (pattern.type) {
          case 'exact':
            return currentUrl === pattern.value;
          case 'contains':
            return currentUrl.includes(pattern.value);
          case 'starts_with':
            return currentUrl.startsWith(pattern.value);
          case 'regex':
            return new RegExp(pattern.value).test(currentUrl);
          default:
            return false;
        }
      });

      return mode === 'include' ? matches : !matches;
    }

    setupSPAMode() {
      // Monitor URL changes for SPAs
      let lastUrl = window.location.href;
      
      const checkUrlChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          
          // Hide current widget if URL targeting no longer matches
          if (!this.shouldShowOnCurrentUrl() && this.isVisible) {
            this.hide();
          }
          // Show widget if URL targeting now matches
          else if (this.shouldShowOnCurrentUrl() && !this.isVisible) {
            setTimeout(() => this.show(), this.config.delay);
          }
        }
      };

      // Check for URL changes periodically
      setInterval(checkUrlChange, 1000);

      // Listen for popstate events (back/forward buttons)
      window.addEventListener('popstate', checkUrlChange);

      // Override pushState and replaceState for SPA navigation
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(checkUrlChange, 100);
      };

      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(checkUrlChange, 100);
      };
    }

    show() {
      if (this.destroyed || this.isVisible || this.surveys.length === 0) {
        return;
      }

      // Check if should show only once
      if (this.config.showOnce && this.hasBeenShown()) {
        return;
      }

      this.createWidget();
      this.isVisible = true;

      // Call onShow callback
      if (this.config.onShow && typeof this.config.onShow === 'function') {
        this.config.onShow(this.getCurrentSurvey());
      }
    }

    hide() {
      if (this.widgetContainer) {
        this.widgetContainer.style.opacity = '0';
        this.widgetContainer.style.transform = this.getHiddenTransform();
        this.isVisible = false;
      }
    }

    close() {
      if (this.widgetContainer) {
        this.widgetContainer.style.opacity = '0';
        this.widgetContainer.style.transform = this.getHiddenTransform();
        
        setTimeout(() => {
          if (this.widgetContainer && this.widgetContainer.parentNode) {
            this.widgetContainer.parentNode.removeChild(this.widgetContainer);
          }
          this.widgetContainer = null;
        }, 300);
      }

      this.isVisible = false;
      this.markAsShown();

      // Call onClose callback
      if (this.config.onClose && typeof this.config.onClose === 'function') {
        this.config.onClose();
      }
    }

    destroy() {
      this.close();
      this.destroyed = true;
      
      // Clean up SPA mode listeners
      if (this.config.spaMode) {
        // Note: In a real implementation, you'd want to store references to the listeners
        // and remove them here to prevent memory leaks
      }
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      // If widget is visible, recreate it with new config
      if (this.isVisible) {
        this.close();
        setTimeout(() => this.show(), 100);
      }
    }

    getStatus() {
      return {
        isVisible: this.isVisible,
        isLoading: this.isLoading,
        surveysCount: this.surveys.length,
        currentSurvey: this.getCurrentSurvey(),
        config: { ...this.config }
      };
    }

    createWidget() {
      if (this.widgetContainer) {
        return;
      }

      this.widgetContainer = document.createElement('div');
      this.widgetContainer.id = 'nps-widget-container';
      this.widgetContainer.style.cssText = this.getWidgetStyles();

      // Create survey content
      const survey = this.getCurrentSurvey();
      this.widgetContainer.innerHTML = this.createSurveyHTML(survey);

      // Add event listeners
      this.attachEventListeners();

      // Add to DOM
      document.body.appendChild(this.widgetContainer);

      // Animate in
      setTimeout(() => {
        if (this.widgetContainer) {
          this.widgetContainer.style.opacity = '1';
          this.widgetContainer.style.transform = this.getVisibleTransform();
        }
      }, 100);
    }

    getWidgetStyles() {
      const { position, primaryColor, roundedCorners } = this.config;
      
      return `
        position: fixed;
        z-index: 9999;
        background: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        opacity: 0;
        transition: all 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ${roundedCorners ? 'border-radius: 12px;' : ''}
        ${this.getPositionStyles()}
        ${this.getHiddenTransform()}
      `;
    }

    getPositionStyles() {
      switch (this.config.position) {
        case 'bottom-left':
          return 'bottom: 20px; left: 20px;';
        case 'top-right':
          return 'top: 20px; right: 20px;';
        case 'top-left':
          return 'top: 20px; left: 20px;';
        case 'center':
          return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
        case 'slide-up':
          return 'bottom: 0; left: 50%; transform: translateX(-50%);';
        case 'slide-down':
          return 'top: 0; left: 50%; transform: translateX(-50%);';
        default: // bottom-right
          return 'bottom: 20px; right: 20px;';
      }
    }

    getHiddenTransform() {
      switch (this.config.position) {
        case 'center':
          return 'transform: translate(-50%, -50%) scale(0.8);';
        case 'slide-up':
          return 'transform: translateX(-50%) translateY(100%);';
        case 'slide-down':
          return 'transform: translateX(-50%) translateY(-100%);';
        default:
          return 'transform: translateY(100%);';
      }
    }

    getVisibleTransform() {
      switch (this.config.position) {
        case 'center':
          return 'transform: translate(-50%, -50%) scale(1);';
        case 'slide-up':
        case 'slide-down':
          return 'transform: translateX(-50%) translateY(0);';
        default:
          return 'transform: translateY(0);';
      }
    }

    createSurveyHTML(survey) {
      const settings = survey.settings || {};
      
      return `
        <div style="padding: 24px; position: relative;">
          ${this.config.closeButton ? `
            <button onclick="window.npsWidgetInstance.close()" style="
              position: absolute;
              top: 12px;
              right: 12px;
              background: none;
              border: none;
              font-size: 20px;
              cursor: pointer;
              color: #666;
              padding: 4px;
              border-radius: 4px;
              line-height: 1;
            " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          ` : ''}
          
          ${this.config.progressBar ? `
            <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${this.config.primaryColor};"></div>
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb;"></div>
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb;"></div>
            </div>
          ` : ''}
          
          <div id="nps-survey-content">
            <div id="nps-question-step">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937; line-height: 1.3;">
                ${settings.npsQuestion || 'How likely are you to recommend us?'}
              </h3>
              ${settings.npsExplanation ? `<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${settings.npsExplanation}</p>` : ''}
              
              <div style="display: flex; justify-content: center; gap: 6px; margin: 16px 0;">
                ${Array.from({length: 11}, (_, i) => `
                  <button onclick="window.npsWidgetInstance.selectScore(${i})" style="
                    width: 28px;
                    height: 28px;
                    border: 1px solid #d1d5db;
                    background: ${this.getScoreColor(i, settings)};
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 12px;
                    color: #374151;
                    transition: all 0.2s;
                  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${i}</button>
                `).join('')}
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-top: 8px;">
                <span>${settings.startLabel || 'Not likely'}</span>
                <span>${settings.endLabel || 'Very likely'}</span>
              </div>
            </div>
            
            <div id="thank-you-step" style="display: none; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                ${settings.thankYouTitle || 'Thank you!'}
              </h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${settings.thankYouDescription || 'Your feedback helps us improve.'}
              </p>
            </div>
          </div>
        </div>
      `;
    }

    attachEventListeners() {
      // Store reference to this widget instance globally for onclick handlers
      window.npsWidgetInstance = this;
    }

    selectScore(score) {
      // Submit response
      this.submitResponse(score);
      
      // Show thank you message
      const questionStep = document.getElementById('nps-question-step');
      const thankYouStep = document.getElementById('thank-you-step');
      
      if (questionStep && thankYouStep) {
        questionStep.style.display = 'none';
        thankYouStep.style.display = 'block';
        
        // Call onResponse callback
        if (this.config.onResponse && typeof this.config.onResponse === 'function') {
          this.config.onResponse({
            score,
            survey: this.getCurrentSurvey(),
            timestamp: new Date().toISOString()
          });
        }
        
        // Auto-close after delay
        setTimeout(() => {
          this.close();
        }, this.config.fadeOutDelay);
      }
    }

    async submitResponse(score, feedback = null) {
      try {
        const survey = this.getCurrentSurvey();
        await this.makeRequest('/functions/v1/submit-response', {
          method: 'POST',
          body: {
            surveyId: survey.id,
            score,
            feedback
          }
        });
      } catch (error) {
        console.error('Failed to submit response:', error);
      }
    }

    getScoreColor(score, settings) {
      if (settings.colorPalette === 'multicolor') {
        if (score <= 6) return settings.colors?.detractors || '#fef2f2';
        if (score <= 8) return settings.colors?.passives || '#fefce8';
        return settings.colors?.promoters || '#f0fdf4';
      }
      return '#f9fafb';
    }

    getCurrentSurvey() {
      return this.surveys[this.currentSurveyIndex] || null;
    }

    hasBeenShown() {
      return localStorage.getItem('nps_widget_shown') !== null;
    }

    markAsShown() {
      if (this.config.showOnce) {
        localStorage.setItem('nps_widget_shown', Date.now().toString());
      }
    }

    getFallbackSurveys() {
      return [{
        id: 'demo-survey',
        name: 'Customer Feedback Survey',
        settings: {
          npsQuestion: 'How likely are you to recommend our service?',
          npsExplanation: 'Please rate us on a scale from 0 to 10',
          startLabel: 'Not at all likely',
          endLabel: 'Extremely likely',
          thankYouTitle: 'Thank you for your feedback!',
          thankYouDescription: 'Your input helps us improve our service.',
          colorPalette: 'multicolor',
          colors: {
            detractors: '#fef2f2',
            passives: '#fefce8', 
            promoters: '#f0fdf4'
          }
        }
      }];
    }

    handleError(message, error) {
      console.error(`NPS Widget Error: ${message}`, error);
      
      if (this.config.onError && typeof this.config.onError === 'function') {
        this.config.onError(message, error);
      }
    }
  }

  // Export to global scope
  window.NPSWidget = NPSWidget;

  // Auto-initialization from script attributes
  (function() {
    const currentScript = document.currentScript;
    if (!currentScript) return;
    
    const autoLoad = currentScript.getAttribute('data-auto-load');
    const apiKey = currentScript.getAttribute('data-api-key');
    
    if (autoLoad && apiKey) {
      new NPSWidget({
        apiKey: apiKey,
        position: currentScript.getAttribute('data-position') || 'bottom-right',
        delay: parseInt(currentScript.getAttribute('data-delay')) || 5000,
        primaryColor: currentScript.getAttribute('data-primary-color') || '#4F46E5',
        showOnce: currentScript.getAttribute('data-show-once') === 'true'
      });
    }
  })();

  console.log(`NPS Widget SDK v${SDK_VERSION} loaded successfully`);

})(window);