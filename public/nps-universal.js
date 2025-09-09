/**
 * Universal NPS Survey Widget
 * This script automatically loads and displays published NPS surveys
 * No need to specify survey IDs - it finds and shows published surveys automatically
 */
(function() {
  // Configuration
  const config = {
    position: document.currentScript?.getAttribute('data-position') || 'bottom-right',
    delay: parseInt(document.currentScript?.getAttribute('data-delay') || '5000'),
    autoRotate: document.currentScript?.getAttribute('data-auto-rotate') !== 'false',
    showOnce: document.currentScript?.getAttribute('data-show-once') === 'true'
  };

  // Check if already shown (if showOnce is enabled)
  const STORAGE_KEY = 'nps_survey_shown';
  if (config.showOnce && localStorage.getItem(STORAGE_KEY)) {
    console.log('NPS Widget: Already shown to this user');
    return;
  }

  let currentSurveyIndex = 0;
  let surveys = [];
  let widgetContainer = null;

  // Fetch published surveys from Supabase
  async function fetchPublishedSurveys() {
    try {
      // Try to fetch from the Netlify function first
      const response = await fetch(`${window.location.origin}/.netlify/functions/published-surveys`, {
        headers: {
          'X-API-Key': getAnonKey(),
          'Authorization': `Bearer ${getAnonKey()}`,
          'apikey': getAnonKey(),
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.surveys || [];
      }
    } catch (error) {
      console.log('NPS Widget: Netlify function not available, trying direct Supabase access');
    }

    // Fallback: try direct Supabase access
    try {
      const supabaseUrl = getSupabaseUrl();
      const anonKey = getAnonKey();
      
      if (supabaseUrl && anonKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/surveys?status=eq.published&select=id,name,settings,responses,score,created_at`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const surveys = await response.json();
          return surveys || [];
        }
      }
    } catch (error) {
      console.log('NPS Widget: Direct Supabase access failed');
    }

    // Final fallback: return demo survey
    return getDemoSurvey();
  }

  // Get Supabase URL from environment or page
  function getSupabaseUrl() {
    // Try to get from window object (if exposed)
    if (window.VITE_SUPABASE_URL) return window.VITE_SUPABASE_URL;
    
    // Try to extract from page meta tags
    const metaTag = document.querySelector('meta[name="supabase-url"]');
    if (metaTag) return metaTag.getAttribute('content');
    
    // Default fallback
    return 'https://lfcmozmbvebsjtwcuwsz.supabase.co';
  }

  // Get Supabase anon key
  function getAnonKey() {
    // Try to get from window object (if exposed)
    if (window.VITE_SUPABASE_ANON_KEY) return window.VITE_SUPABASE_ANON_KEY;
    
    // Try to extract from page meta tags
    const metaTag = document.querySelector('meta[name="supabase-anon-key"]');
    if (metaTag) return metaTag.getAttribute('content');
    
    // Default fallback
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmY21vem1idmVic2p0d2N1d3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Njg3MDYsImV4cCI6MjA2NzA0NDcwNn0.jQuKb7xvRDQt4iITmRfTme6-HYwt7GwLi75pEDW2v3U';
  }

  // Get demo survey for fallback
  function getDemoSurvey() {
    return [{
      id: 'demo-survey',
      name: 'Customer Feedback Survey',
      settings: {
        npsQuestion: 'How likely are you to recommend our service to a friend or colleague?',
        npsExplanation: 'Please rate us on a scale from 0 to 10',
        startLabel: 'Not at all likely',
        endLabel: 'Extremely likely',
        feedbackQuestion: 'What is the main reason for your score?',
        feedbackExplanation: 'Your feedback helps us improve our service.',
        thankYouTitle: 'Thank you for your feedback!',
        thankYouDescription: 'Your input helps us improve our service.',
        colorPalette: 'multicolor',
        colors: {
          detractors: '#FFECEC',
          passives: '#FFF9E6', 
          promoters: '#E8FFEA'
        },
        roundedCorners: true,
        progressBar: true,
        closeButton: true,
        backButtonText: 'Back',
        continueButtonText: 'Submit',
        skipButtonText: 'Skip',
        feedbackType: 'text',
        maxLength: 500,
        selectorType: 'zero-to-ten' // Force standard 0-10 selector
      }
    }];
  }

  // Create the widget container
  function createWidget() {
    if (widgetContainer) return;

    widgetContainer = document.createElement('div');
    widgetContainer.id = 'nps-universal-widget';
    widgetContainer.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
      ${getPositionStyles()}
    `;

    document.body.appendChild(widgetContainer);
    
    // Animate in
    setTimeout(() => {
      if (widgetContainer) {
        widgetContainer.style.transform = 'translateY(0)';
      }
    }, 100);
  }

  // Get position styles based on config
  function getPositionStyles() {
    switch(config.position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      case 'center':
        return 'top: 50%; left: 50%; transform: translate(-50%, -50%) translateY(100%);';
      default: // bottom-right
        return 'bottom: 20px; right: 20px;';
    }
  }

  // Create embedded survey widget
  function createEmbeddedSurvey(survey) {
    const settings = survey.settings || {};
    
    return `
      <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="position: absolute; top: 12px; right: 12px;">
          <button onclick="closeNPSWidget()" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 4px;
            border-radius: 4px;
            line-height: 1;
          " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
        </div>
        
        <div id="nps-survey-content">
          <div id="nps-question-step">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937; line-height: 1.3;">
              ${settings.npsQuestion || 'How likely are you to recommend us?'}
            </h3>
            ${settings.npsExplanation ? `<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${settings.npsExplanation}</p>` : ''}
            
            <div style="display: flex; justify-content: center; gap: 6px; margin: 16px 0;">
              ${Array.from({length: 11}, (_, i) => `
                <button onclick="selectScore(${i})" style="
                  width: 28px;
                  height: 28px;
                  border: 1px solid #d1d5db;
                  background: ${getScoreColor(i, settings)};
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

  // Get score color based on settings
  function getScoreColor(score, settings) {
    if (settings.colorPalette === 'multicolor') {
      if (score <= 6) return settings.colors?.detractors || '#fef2f2';
      if (score <= 8) return settings.colors?.passives || '#fefce8';
      return settings.colors?.promoters || '#f0fdf4';
    }
    return '#f9fafb';
  }

  // Load survey into widget
  function loadSurvey(survey) {
    if (!widgetContainer) return;

    // Check if we should use iframe or embedded version
    const useIframe = survey.id !== 'demo-survey';
    
    if (useIframe) {
      const surveyUrl = `${window.location.origin}/s/${survey.id}?embed=true`;
      widgetContainer.innerHTML = `
        <div style="position: relative; height: 350px;">
          <button onclick="closeNPSWidget()" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #666;
            z-index: 10;
            padding: 4px;
            border-radius: 4px;
          " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          <iframe 
            src="${surveyUrl}" 
            style="
              border: none;
              width: 100%;
              height: 100%;
              border-radius: 12px;
            "
          ></iframe>
        </div>
      `;
    } else {
      // Use embedded version for demo
      widgetContainer.innerHTML = createEmbeddedSurvey(survey);
    }
  }

  // Global functions for embedded survey
  window.selectScore = function(score) {
    // Mark as completed
    if (config.showOnce) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
    
    // Show thank you message
    const questionStep = document.getElementById('nps-question-step');
    const thankYouStep = document.getElementById('thank-you-step');
    
    if (questionStep && thankYouStep) {
      questionStep.style.display = 'none';
      thankYouStep.style.display = 'block';
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        closeNPSWidget();
      }, 3000);
    }
  };

  // Close widget function (global)
  window.closeNPSWidget = function() {
    if (widgetContainer) {
      widgetContainer.style.transform = config.position === 'center' 
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
    
    // Mark as shown if showOnce is enabled
    if (config.showOnce) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  };

  // Show next survey (if multiple surveys and auto-rotate is enabled)
  function showNextSurvey() {
    if (surveys.length === 0) return;
    
    if (config.autoRotate && surveys.length > 1) {
      currentSurveyIndex = (currentSurveyIndex + 1) % surveys.length;
    }
    
    createWidget();
    loadSurvey(surveys[currentSurveyIndex]);
  }

  // Initialize the widget
  async function init() {
    console.log('NPS Widget: Initializing...');
    
    surveys = await fetchPublishedSurveys();
    console.log('NPS Widget: Found surveys:', surveys.length);
    
    if (surveys.length === 0) {
      console.log('NPS Widget: No published surveys found');
      return;
    }

    console.log('NPS Widget: Will show widget after', config.delay, 'ms');
    
    // Show widget after delay
    setTimeout(() => {
      console.log('NPS Widget: Showing widget');
      showNextSurvey();
    }, config.delay);

    // If auto-rotate is enabled and multiple surveys, rotate every 30 seconds
    if (config.autoRotate && surveys.length > 1) {
      setInterval(() => {
        if (widgetContainer) {
          console.log('NPS Widget: Auto-rotating to next survey');
          showNextSurvey();
        }
      }, 30000);
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();