import React, { useEffect, useState } from 'react';

// Example 1: Basic Universal Widget
export function BasicNPSWidget() {
  useEffect(() => {
    // Load the universal widget
    const script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-delay', '5000');
    script.setAttribute('data-auto-rotate', 'true');
    script.setAttribute('data-show-once', 'false');
    
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
      
      // Remove any widget containers
      const widgets = document.querySelectorAll('#nps-universal-widget, #nps-widget-container');
      widgets.forEach(widget => widget.remove());
    };
  }, []);

  return (
    <div>
      <h1>My React App</h1>
      <p>The NPS widget will appear automatically after 5 seconds.</p>
    </div>
  );
}

// Example 2: Conditional Widget Loading
export function ConditionalNPSWidget({ showWidget, surveyId }) {
  useEffect(() => {
    if (!showWidget || !surveyId) return;

    // Use the SDK if available, otherwise load script directly
    if (window.NPSWidget) {
      window.NPSWidget.loadSurvey(surveyId, {
        position: 'bottom-right',
        delay: 2000
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-widget.js';
      script.setAttribute('data-survey-id', surveyId);
      script.setAttribute('data-position', 'bottom-right');
      script.setAttribute('data-delay', '2000');
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup
      if (window.NPSWidget) {
        window.NPSWidget.removeAll();
      }
    };
  }, [showWidget, surveyId]);

  return (
    <div>
      <h2>Conditional Widget Example</h2>
      <p>Widget will show when showWidget is true and surveyId is provided.</p>
    </div>
  );
}

// Example 3: Inline Survey Component
export function InlineSurveyWidget({ surveyId }) {
  const containerId = `nps-survey-${surveyId}`;

  useEffect(() => {
    if (!surveyId) return;

    const script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-inline.js';
    script.setAttribute('data-survey-id', surveyId);
    script.setAttribute('data-container', containerId);
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [surveyId, containerId]);

  return (
    <div className="survey-container">
      <h3>Please share your feedback</h3>
      <div 
        id={containerId}
        style={{
          minHeight: '300px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f7fafc'
        }}
      >
        Loading survey...
      </div>
    </div>
  );
}

// Example 4: Survey List with Dynamic Loading
export function SurveyListWidget() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    // Check available surveys
    if (window.NPSWidget) {
      window.NPSWidget.checkSurveys((error, surveyList) => {
        if (error) {
          console.error('Error loading surveys:', error);
        } else {
          setSurveys(surveyList);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadSurvey = (surveyId) => {
    setSelectedSurvey(surveyId);
    
    if (window.NPSWidget) {
      window.NPSWidget.removeAll(); // Remove existing widgets
      window.NPSWidget.loadSurvey(surveyId, {
        position: 'center',
        delay: 500
      });
    }
  };

  if (loading) {
    return <div>Loading surveys...</div>;
  }

  return (
    <div>
      <h3>Available Surveys</h3>
      {surveys.length === 0 ? (
        <p>No surveys available</p>
      ) : (
        <div>
          {surveys.map(survey => (
            <div key={survey.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <h4>{survey.name}</h4>
              <p>Responses: {survey.responses} | NPS Score: {survey.score}</p>
              <button 
                onClick={() => loadSurvey(survey.id)}
                style={{
                  background: selectedSurvey === survey.id ? '#48bb78' : '#4299e1',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {selectedSurvey === survey.id ? 'Loaded' : 'Load Survey'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Example 5: Hook for NPS Widget Management
export function useNPSWidget() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if SDK is already loaded
    if (window.NPSWidget) {
      setIsLoaded(true);
      return;
    }

    // Load SDK
    const script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-sdk.js';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const loadUniversal = (options = {}) => {
    if (window.NPSWidget) {
      return window.NPSWidget.loadUniversal(options);
    }
  };

  const loadSurvey = (surveyId, options = {}) => {
    if (window.NPSWidget) {
      return window.NPSWidget.loadSurvey(surveyId, options);
    }
  };

  const loadInline = (surveyId, containerId, options = {}) => {
    if (window.NPSWidget) {
      return window.NPSWidget.loadInline(surveyId, containerId, options);
    }
  };

  const removeAll = () => {
    if (window.NPSWidget) {
      window.NPSWidget.removeAll();
    }
  };

  const checkSurveys = (callback) => {
    if (window.NPSWidget) {
      window.NPSWidget.checkSurveys(callback);
    }
  };

  return {
    isLoaded,
    loadUniversal,
    loadSurvey,
    loadInline,
    removeAll,
    checkSurveys
  };
}

// Example usage of the hook
export function MyAppWithNPS() {
  const nps = useNPSWidget();

  useEffect(() => {
    if (nps.isLoaded) {
      // Load universal widget when SDK is ready
      nps.loadUniversal({
        position: 'bottom-right',
        delay: 5000,
        autoRotate: true,
        showOnce: false
      });
    }
  }, [nps.isLoaded]);

  return (
    <div>
      <h1>My App</h1>
      <p>NPS Widget SDK Status: {nps.isLoaded ? 'Loaded' : 'Loading...'}</p>
      
      <button onClick={() => nps.removeAll()}>
        Remove All Widgets
      </button>
      
      <button onClick={() => nps.loadUniversal({ position: 'center', delay: 1000 })}>
        Show Widget Now
      </button>
    </div>
  );
}