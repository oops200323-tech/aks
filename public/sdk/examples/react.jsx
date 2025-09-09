import React, { useEffect, useRef, useState } from 'react';

/**
 * React Hook for NPS Widget
 */
export function useNPSWidget(config) {
  const widgetRef = useRef(null);
  const [status, setStatus] = useState({
    isVisible: false,
    isLoading: false,
    surveysCount: 0
  });

  useEffect(() => {
    if (!config.apiKey) {
      console.error('NPS Widget: API key is required');
      return;
    }

    // Initialize widget
    widgetRef.current = new window.NPSWidget({
      ...config,
      onShow: (survey) => {
        setStatus(prev => ({ ...prev, isVisible: true }));
        if (config.onShow) config.onShow(survey);
      },
      onClose: () => {
        setStatus(prev => ({ ...prev, isVisible: false }));
        if (config.onClose) config.onClose();
      },
      onResponse: (data) => {
        if (config.onResponse) config.onResponse(data);
      },
      onError: (message, error) => {
        console.error('NPS Widget Error:', message, error);
        if (config.onError) config.onError(message, error);
      }
    });

    // Update status periodically
    const statusInterval = setInterval(() => {
      if (widgetRef.current) {
        const widgetStatus = widgetRef.current.getStatus();
        setStatus(widgetStatus);
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [config.apiKey]);

  const show = () => widgetRef.current?.show();
  const hide = () => widgetRef.current?.hide();
  const close = () => widgetRef.current?.close();
  const updateConfig = (newConfig) => widgetRef.current?.updateConfig(newConfig);

  return {
    status,
    show,
    hide,
    close,
    updateConfig
  };
}

/**
 * Basic NPS Widget Component
 */
export function NPSWidgetComponent({ 
  apiKey, 
  position = 'bottom-right',
  primaryColor = '#4F46E5',
  delay = 5000,
  onResponse,
  onShow,
  onClose,
  onError,
  ...otherProps 
}) {
  const { status } = useNPSWidget({
    apiKey,
    position,
    primaryColor,
    delay,
    onResponse,
    onShow,
    onClose,
    onError,
    ...otherProps
  });

  // This component doesn't render anything visible
  // The widget is rendered as a portal by the SDK
  return null;
}

/**
 * Advanced NPS Widget with Controls
 */
export function NPSWidgetWithControls({ apiKey, ...initialConfig }) {
  const [config, setConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#4F46E5',
    delay: 5000,
    showOnce: false,
    autoRotate: true,
    spaMode: true,
    ...initialConfig
  });

  const { status, show, hide, close, updateConfig } = useNPSWidget({
    apiKey,
    ...config,
    onResponse: (data) => {
      console.log('NPS Response:', data);
      // Add your analytics tracking here
      if (window.gtag) {
        window.gtag('event', 'nps_response', {
          event_category: 'NPS',
          value: data.score
        });
      }
    }
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfig({ [key]: value });
  };

  return (
    <div className="nps-widget-controls">
      <div className="controls-header">
        <h3>NPS Widget Controls</h3>
        <div className="status-indicator">
          Status: {status.isVisible ? '🟢 Visible' : '🔴 Hidden'} 
          | Surveys: {status.surveysCount}
        </div>
      </div>

      <div className="controls-grid">
        <div className="control-group">
          <label>Position:</label>
          <select 
            value={config.position} 
            onChange={(e) => handleConfigChange('position', e.target.value)}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="center">Center Modal</option>
            <option value="slide-up">Slide Up</option>
            <option value="slide-down">Slide Down</option>
          </select>
        </div>

        <div className="control-group">
          <label>Primary Color:</label>
          <input 
            type="color" 
            value={config.primaryColor}
            onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>Delay (ms):</label>
          <input 
            type="number" 
            value={config.delay}
            onChange={(e) => handleConfigChange('delay', parseInt(e.target.value))}
            min="0"
            max="60000"
            step="1000"
          />
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={config.showOnce}
              onChange={(e) => handleConfigChange('showOnce', e.target.checked)}
            />
            Show Once
          </label>
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={config.autoRotate}
              onChange={(e) => handleConfigChange('autoRotate', e.target.checked)}
            />
            Auto Rotate
          </label>
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={config.spaMode}
              onChange={(e) => handleConfigChange('spaMode', e.target.checked)}
            />
            SPA Mode
          </label>
        </div>
      </div>

      <div className="control-buttons">
        <button onClick={show} className="btn-primary">Show Widget</button>
        <button onClick={hide} className="btn-secondary">Hide Widget</button>
        <button onClick={close} className="btn-secondary">Close Widget</button>
      </div>

      <style jsx>{`
        .nps-widget-controls {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }
        
        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .controls-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .status-indicator {
          font-size: 14px;
          color: #6b7280;
          font-family: monospace;
        }
        
        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .control-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        
        .control-group input,
        .control-group select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .control-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }
        
        .control-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
}

/**
 * Example App Component
 */
export default function App() {
  const [apiKey, setApiKey] = useState('nps_demo_key_12345');
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>NPS Widget React Integration</h1>
        <p>Demonstration of NPS Widget SDK with React</p>
      </header>

      <main className="app-main">
        <div className="api-key-section">
          <label>
            API Key:
            <input 
              type="text" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your NPS API key"
            />
          </label>
        </div>

        {apiKey && (
          <>
            {/* Basic Widget */}
            <NPSWidgetComponent 
              apiKey={apiKey}
              position="bottom-right"
              delay={3000}
              onResponse={(data) => {
                console.log('Basic widget response:', data);
              }}
            />

            {/* Advanced Widget with Controls */}
            <NPSWidgetWithControls 
              apiKey={apiKey}
              spaMode={true}
              urlTargeting={{
                enabled: false,
                mode: 'all',
                patterns: []
              }}
            />
          </>
        )}

        <div className="documentation">
          <h2>Usage Examples</h2>
          
          <div className="code-example">
            <h3>Basic Usage</h3>
            <pre>{`import { NPSWidgetComponent } from './nps-widget-react';

function App() {
  return (
    <div>
      <NPSWidgetComponent 
        apiKey="nps_your_api_key_here"
        position="bottom-right"
        primaryColor="#4F46E5"
        delay={5000}
        onResponse={(data) => {
          console.log('NPS Response:', data);
        }}
      />
    </div>
  );
}`}</pre>
          </div>

          <div className="code-example">
            <h3>Using the Hook</h3>
            <pre>{`import { useNPSWidget } from './nps-widget-react';

function MyComponent() {
  const { status, show, hide, close } = useNPSWidget({
    apiKey: 'nps_your_api_key_here',
    position: 'center',
    spaMode: true,
    onResponse: (data) => {
      // Handle response
      analytics.track('NPS Response', {
        score: data.score,
        survey_id: data.survey.id
      });
    }
  });

  return (
    <div>
      <p>Widget Status: {status.isVisible ? 'Visible' : 'Hidden'}</p>
      <button onClick={show}>Show NPS</button>
      <button onClick={hide}>Hide NPS</button>
    </div>
  );
}`}</pre>
          </div>
        </div>
      </main>

      <style jsx>{`
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .app-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .app-header h1 {
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .app-header p {
          color: #6b7280;
        }
        
        .api-key-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .api-key-section label {
          display: block;
          font-weight: 500;
          color: #374151;
        }
        
        .api-key-section input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-top: 8px;
          font-family: monospace;
        }
        
        .documentation {
          margin-top: 40px;
        }
        
        .code-example {
          margin: 20px 0;
        }
        
        .code-example h3 {
          color: #1f2937;
          margin-bottom: 12px;
        }
        
        .code-example pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}