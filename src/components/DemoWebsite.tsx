import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Users, TrendingUp, MessageSquare, Zap, RefreshCw } from 'lucide-react';

interface Survey {
  id: string;
  name: string;
  status: 'draft' | 'published';
  created_at: string;
  responses?: number;
  score?: number;
}

interface DemoWebsiteProps {
  surveys: Survey[];
}

const DemoWebsite: React.FC<DemoWebsiteProps> = ({ surveys }) => {
  const [widgetType, setWidgetType] = useState<'universal' | 'specific'>('universal');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const publishedSurveys = surveys.filter(survey => survey.status === 'published');

  useEffect(() => {
    if (publishedSurveys.length > 0 && !selectedSurvey) {
      setSelectedSurvey(publishedSurveys[0]);
    }
  }, [publishedSurveys, selectedSurvey]);

  const loadWidget = () => {
    // Clean up any existing scripts and widgets
    const existingScripts = document.querySelectorAll('script[src*="nps-"]');
    existingScripts.forEach(script => script.remove());

    const existingWidgets = document.querySelectorAll('#nps-widget-container, #nps-universal-widget, [id^="nps-survey-"]');
    existingWidgets.forEach(widget => widget.remove());

    // Clear localStorage for testing
    localStorage.removeItem('nps_survey_shown');

    setWidgetLoaded(false);

    // Load the appropriate widget
    setTimeout(() => {
      const script = document.createElement('script');
      
      if (widgetType === 'universal') {
        script.src = '/nps-universal.js';
        script.setAttribute('data-position', 'bottom-right');
        script.setAttribute('data-delay', '2000'); // Shorter delay for demo
        script.setAttribute('data-auto-rotate', 'true');
        script.setAttribute('data-show-once', 'false');
      } else if (selectedSurvey) {
        script.src = '/nps-widget.js';
        script.setAttribute('data-survey-id', selectedSurvey.id);
        script.setAttribute('data-position', 'bottom-right');
        script.setAttribute('data-delay', '2000'); // Shorter delay for demo
      }
      
      script.onload = () => {
        setWidgetLoaded(true);
        console.log('Widget script loaded successfully');
      };
      
      script.onerror = () => {
        console.error('Failed to load widget script');
      };
      
      document.head.appendChild(script);
    }, 100);
  };

  useEffect(() => {
    loadWidget();
  }, [widgetType, selectedSurvey]);

  const goBack = () => {
    window.close();
  };

  const resetWidget = () => {
    localStorage.removeItem('nps_survey_shown');
    loadWidget();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="btn-secondary"
            >
              <ArrowLeft size={18} />
              Back to App
            </button>
            <div>
              <h1 className="text-lg font-semibold">Demo Website</h1>
              <p className="text-sm text-gray-500">See how NPS surveys work on a real website</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={resetWidget}
              className="btn-secondary text-sm"
            >
              <RefreshCw size={16} />
              Reset Widget
            </button>
            
            {publishedSurveys.length > 0 && (
              <>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setWidgetType('universal')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-2 ${
                      widgetType === 'universal'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Zap size={16} />
                    Universal Widget
                  </button>
                  <button
                    onClick={() => setWidgetType('specific')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      widgetType === 'specific'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Specific Survey
                  </button>
                </div>
                
                {widgetType === 'specific' && (
                  <select
                    value={selectedSurvey?.id || ''}
                    onChange={(e) => {
                      const survey = publishedSurveys.find(s => s.id === e.target.value);
                      setSelectedSurvey(survey || null);
                    }}
                    className="input-field text-sm"
                  >
                    {publishedSurveys.map(survey => (
                      <option key={survey.id} value={survey.id}>
                        {survey.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {publishedSurveys.length === 0 ? (
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center py-16">
            <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-500 mb-4">No Published Surveys</h2>
            <p className="text-gray-400 mb-8">
              You need to publish at least one survey to see the demo.
            </p>
            <button
              onClick={goBack}
              className="btn-primary"
            >
              Go Back and Create a Survey
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Demo Website Content */}
          <div className="max-w-6xl mx-auto p-8">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to TechCorp Solutions
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Innovative software solutions for modern businesses
                </p>
                <div className="flex justify-center gap-4">
                  <button className="btn-primary">
                    Get Started
                  </button>
                  <button className="btn-secondary">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
                <p className="text-gray-600">
                  Get real-time insights into your business performance with our advanced analytics platform.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
                  <Users className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
                <p className="text-gray-600">
                  Work seamlessly with your team using our integrated collaboration tools and workflows.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
                  <Star className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Premium Support</h3>
                <p className="text-gray-600">
                  Get 24/7 support from our expert team to help you succeed with our platform.
                </p>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  About TechCorp Solutions
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Founded in 2020, TechCorp Solutions has been at the forefront of digital transformation, 
                  helping businesses of all sizes leverage technology to achieve their goals. Our team of 
                  experienced developers and consultants work closely with clients to deliver customized 
                  solutions that drive growth and efficiency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                    <div className="text-gray-600">Happy Clients</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
                    <div className="text-gray-600">Projects Completed</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          {widgetType === 'universal' ? (
            <div className="fixed top-20 left-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-sm z-40">
              <div className="flex items-center mb-2">
                <Zap size={16} className="text-indigo-600 mr-2" />
                <h4 className="font-medium text-indigo-900">Universal Widget Active</h4>
              </div>
              <p className="text-sm text-indigo-800 mb-2">
                The universal widget automatically shows ALL published surveys ({publishedSurveys.length} found). 
                It will appear in the bottom-right corner after 2 seconds.
              </p>
              {publishedSurveys.length > 0 && (
                <div className="text-xs text-indigo-700">
                  Published surveys: {publishedSurveys.map(s => s.name).join(', ')}
                </div>
              )}
              <div className="mt-2 text-xs text-indigo-600">
                Status: {widgetLoaded ? '✅ Widget Loaded' : '⏳ Loading...'}
              </div>
            </div>
          ) : (
            <div className="fixed top-20 left-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm z-40">
              <h4 className="font-medium text-blue-900 mb-2">Specific Survey Demo</h4>
              <p className="text-sm text-blue-800 mb-2">
                Showing specific survey: <strong>{selectedSurvey?.name}</strong>. 
                The popup will appear in the bottom-right corner after 2 seconds.
              </p>
              <div className="text-xs text-blue-600">
                Status: {widgetLoaded ? '✅ Widget Loaded' : '⏳ Loading...'}
              </div>
            </div>
          )}

          {/* Widget Code Display */}
          <div className="fixed bottom-4 left-4 bg-gray-900 text-green-400 rounded-lg p-4 max-w-md text-xs font-mono z-40">
            <div className="text-white mb-2">Current Widget Code:</div>
            <div className="overflow-x-auto">
              {widgetType === 'universal' ? (
                <pre>{`<script src="/nps-universal.js"
  data-position="bottom-right"
  data-delay="2000"
  data-auto-rotate="true"
  data-show-once="false">
</script>`}</pre>
              ) : (
                <pre>{`<script src="/nps-widget.js"
  data-survey-id="${selectedSurvey?.id}"
  data-position="bottom-right"
  data-delay="2000">
</script>`}</pre>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoWebsite;