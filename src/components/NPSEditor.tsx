import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Save, Eye, EyeOff, Plus, X } from 'lucide-react';
import SharedPreview from './SharedPreview';

interface NPSEditorProps {
  survey: any;
  onSaveDraft: (settings: any) => void;
  onPublish: (settings: any) => void;
  onBackToDashboard: () => void;
}

const defaultSettings = {
  npsQuestion: 'How likely are you to recommend us to a friend or colleague?',
  npsExplanation: 'Please select a value from 0-10, where 0 is not likely at all and 10 is extremely likely.',
  feedbackQuestion: 'What is the main reason for your score?',
  feedbackExplanation: 'Your feedback helps us improve our product and services.',
  startLabel: 'Not at all likely',
  endLabel: 'Extremely likely',
  widgetPosition: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'slide-up' | 'slide-down',
  widgetDelay: 5000,
  urlTargeting: {
    enabled: false,
    targetType: 'all' as 'all' | 'specific' | 'contains' | 'starts-with' | 'regex',
    urls: [] as string[],
    excludeUrls: [] as string[],
    spaMode: false
  },
  colors: {
    detractors: '#FFECEC',
    passives: '#FFF9E6',
    promoters: '#E8FFEA'
  },
  colorPalette: 'plain' as 'plain' | 'multicolor',
  maxLength: 500,
  backButtonText: 'Back',
  continueButtonText: 'Submit',
  skipButtonText: 'Skip',
  thankYouTitle: 'Thank you for your feedback!',
  thankYouDescription: 'Your responses help us improve our product.',
  autoFadeOut: true,
  fadeOutDelay: 3,
  roundedCorners: true,
  highlightBorder: false,
  progressBar: true,
  closeButton: true,
  isMandatory: false,
  feedbackType: 'text' as 'text' | 'predefined' | 'multiple_choice',
  selectorType: 'zero-to-ten' as 'zero-to-ten' | 'one-to-five' | 'three-emoji' | 'five-emoji', // Default to standard 0-10
  predefinedOptions: {
    detractors: ['Product is difficult to use', 'Missing key features', 'Too expensive', 'Poor customer support'],
    passives: ['Product is good but could be better', 'Some features need improvement', 'Decent value for money'],
    promoters: ['Great product overall', 'Excellent customer support', 'Good value for money', 'Easy to use']
  },
  multipleChoiceOptions: [
    'Product features',
    'Ease of use',
    'Customer support',
    'Price',
    'Documentation',
    'Integration capabilities'
  ]
};

const NPSEditor: React.FC<NPSEditorProps> = ({ survey, onSaveDraft, onPublish, onBackToDashboard }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);
  const [previewSection, setPreviewSection] = useState<'nps-question' | 'feedback-question' | 'thank-you'>('nps-question');
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (survey && survey.settings) {
      setSettings({
        ...defaultSettings,
        ...survey.settings,
        selectorType: survey.settings.selectorType || 'zero-to-ten' // Ensure default is 0-10
      });
    } else {
      setSettings(defaultSettings);
    }
    setIsDirty(false);
  }, [survey]);

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [key]: value
      };
    });
    setIsDirty(true);
  };

  const handleAddOption = (type: 'detractors' | 'passives' | 'promoters' | 'multiple_choice') => {
    if (type === 'multiple_choice') {
      setSettings(prev => ({
        ...prev,
        multipleChoiceOptions: [...prev.multipleChoiceOptions, '']
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        predefinedOptions: {
          ...prev.predefinedOptions,
          [type]: [...prev.predefinedOptions[type], '']
        }
      }));
    }
    setIsDirty(true);
  };

  const handleRemoveOption = (type: 'detractors' | 'passives' | 'promoters' | 'multiple_choice', index: number) => {
    if (type === 'multiple_choice') {
      setSettings(prev => ({
        ...prev,
        multipleChoiceOptions: prev.multipleChoiceOptions.filter((_, i) => i !== index)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        predefinedOptions: {
          ...prev.predefinedOptions,
          [type]: prev.predefinedOptions[type].filter((_, i) => i !== index)
        }
      }));
    }
    setIsDirty(true);
  };

  const handleScoreClick = (score: number) => {
    setPreviewScore(score);
    setPreviewSection('feedback-question');
  };

  const handleBackClick = () => {
    setPreviewSection('nps-question');
  };

  const handleFeedbackSubmit = () => {
    setPreviewSection('thank-you');
    setTimeout(() => {
      setPreviewSection('nps-question');
      setPreviewScore(null);
      setFeedbackText('');
    }, 2000);
  };

  const resetPreview = () => {
    setPreviewSection('nps-question');
    setPreviewScore(null);
    setFeedbackText('');
  };

  const handleSaveDraft = async () => {
    await onSaveDraft(settings);
    setIsDirty(false);
  };

  const handleBackToDashboard = async () => {
    if (isDirty) {
      await handleSaveDraft();
    }
    onBackToDashboard();
  };

  const renderOptionsList = (type: 'detractors' | 'passives' | 'promoters' | 'multiple_choice') => {
    const options = type === 'multiple_choice' 
      ? settings.multipleChoiceOptions 
      : settings.predefinedOptions[type];

    return (
      <div className="space-y-2">
        {options.map((option: string, index: number) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => {
                if (type === 'multiple_choice') {
                  const newOptions = [...settings.multipleChoiceOptions];
                  newOptions[index] = e.target.value;
                  handleSettingsChange('multipleChoiceOptions', newOptions);
                } else {
                  const newOptions = [...settings.predefinedOptions[type]];
                  newOptions[index] = e.target.value;
                  handleSettingsChange('predefinedOptions', {
                    ...settings.predefinedOptions,
                    [type]: newOptions
                  });
                }
              }}
              placeholder="Enter option text"
              className="input-field flex-1"
            />
            <button
              onClick={() => handleRemoveOption(type, index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove option"
            >
              <X size={20} />
            </button>
          </div>
        ))}
        <button
          onClick={() => handleAddOption(type)}
          className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Option
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="btn-secondary"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">{survey ? survey.name : 'New Survey'}</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSaveDraft}
            className={`btn-secondary ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isDirty}
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            onClick={() => onPublish(settings)}
            className="btn-primary"
          >
            <Check size={18} />
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Form */}
        <div className="w-2/3 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* NPS Question Section */}
            <section className="mb-10">
              <h2 className="section-title">NPS Question</h2>
              <div className="card">
                <div className="mb-6">
                  <label htmlFor="npsQuestion" className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <input
                    id="npsQuestion"
                    type="text"
                    value={settings.npsQuestion}
                    onChange={(e) => handleSettingsChange('npsQuestion', e.target.value)}
                    className="input-field"
                    placeholder="How likely are you to recommend us to a friend or colleague?"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="npsExplanation" className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <textarea
                    id="npsExplanation"
                    value={settings.npsExplanation}
                    onChange={(e) => handleSettingsChange('npsExplanation', e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="Please rate on a scale from 0 to 10"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startLabel" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Label (0)
                    </label>
                    <input
                      id="startLabel"
                      type="text"
                      value={settings.startLabel}
                      onChange={(e) => handleSettingsChange('startLabel', e.target.value)}
                      className="input-field"
                      placeholder="Not at all likely"
                    />
                  </div>
                  <div>
                    <label htmlFor="endLabel" className="block text-sm font-medium text-gray-700 mb-2">
                      End Label (10)
                    </label>
                    <input
                      id="endLabel"
                      type="text"
                      value={settings.endLabel}
                      onChange={(e) => handleSettingsChange('endLabel', e.target.value)}
                      className="input-field"
                      placeholder="Extremely likely"
                    />
                  </div>
                </div>
              </div>
            </section>
            
            {/* Feedback Question Section */}
            <section className="mb-10">
              <h2 className="section-title">Feedback Question</h2>
              <div className="card">
                <div className="mb-6">
                  <label htmlFor="feedbackQuestion" className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <input
                    id="feedbackQuestion"
                    type="text"
                    value={settings.feedbackQuestion}
                    onChange={(e) => handleSettingsChange('feedbackQuestion', e.target.value)}
                    className="input-field"
                    placeholder="What is the main reason for your score?"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="feedbackExplanation" className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <textarea
                    id="feedbackExplanation"
                    value={settings.feedbackExplanation}
                    onChange={(e) => handleSettingsChange('feedbackExplanation', e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="Your feedback helps us improve."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSettingsChange('feedbackType', 'text')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.feedbackType === 'text'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-1">Free Text</div>
                      <div className="text-xs text-gray-500">Allow users to write their own feedback</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('feedbackType', 'predefined')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.feedbackType === 'predefined'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-1">Predefined Options</div>
                      <div className="text-xs text-gray-500">Show different options based on score</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('feedbackType', 'multiple_choice')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.feedbackType === 'multiple_choice'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-1">Multiple Choice</div>
                      <div className="text-xs text-gray-500">Fixed set of options for all scores</div>
                    </button>
                  </div>
                </div>

                {settings.feedbackType === 'text' && (
                  <div className="mb-6">
                    <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Characters
                    </label>
                    <input
                      id="maxLength"
                      type="number"
                      min="100"
                      max="2000"
                      value={settings.maxLength}
                      onChange={(e) => handleSettingsChange('maxLength', parseInt(e.target.value))}
                      className="input-field"
                    />
                  </div>
                )}

                {settings.feedbackType === 'predefined' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detractor Options (0-6)
                      </label>
                      {renderOptionsList('detractors')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Passive Options (7-8)
                      </label>
                      {renderOptionsList('passives')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promoter Options (9-10)
                      </label>
                      {renderOptionsList('promoters')}
                    </div>
                  </div>
                )}

                {settings.feedbackType === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Multiple Choice Options
                    </label>
                    {renderOptionsList('multiple_choice')}
                  </div>
                )}
                
                <div className="flex items-center mb-6">
                  <input
                    id="isMandatory"
                    type="checkbox"
                    checked={settings.isMandatory}
                    onChange={(e) => handleSettingsChange('isMandatory', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isMandatory" className="ml-2 block text-sm text-gray-700">
                    Feedback is mandatory
                  </label>
                </div>
              </div>
            </section>
            
            {/* Thank You Section */}
            <section className="mb-10">
              <h2 className="section-title">Thank You Message</h2>
              <div className="card">
                <div className="mb-6">
                  <label htmlFor="thankYouTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    id="thankYouTitle"
                    type="text"
                    value={settings.thankYouTitle}
                    onChange={(e) => handleSettingsChange('thankYouTitle', e.target.value)}
                    className="input-field"
                    placeholder="Thank you for your feedback!"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="thankYouDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="thankYouDescription"
                    value={settings.thankYouDescription}
                    onChange={(e) => handleSettingsChange('thankYouDescription', e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="Your responses help us improve our product."
                  />
                </div>
                
                <div className="flex items-center mb-4">
                  <input
                    id="autoFadeOut"
                    type="checkbox"
                    checked={settings.autoFadeOut}
                    onChange={(e) => handleSettingsChange('autoFadeOut', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="autoFadeOut" className="ml-2 block text-sm text-gray-700">
                    Auto fade out
                  </label>
                </div>
                
                {settings.autoFadeOut && (
                  <div className="mb-6 pl-6">
                    <label htmlFor="fadeOutDelay" className="block text-sm font-medium text-gray-700 mb-2">
                      Fade Out Delay (seconds)
                    </label>
                    <input
                      id="fadeOutDelay"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.fadeOutDelay}
                      onChange={(e) => handleSettingsChange('fadeOutDelay', parseInt(e.target.value))}
                      className="input-field"
                    />
                  </div>
                )}
              </div>
            </section>
            
            {/* Widget Display Settings */}
            <section className="mb-10">
              <h2 className="section-title">Widget Display Settings</h2>
              <div className="card">
               {/* Widget Position Preview */}
               <div className="mb-8">
                 <label className="block text-sm font-medium text-gray-700 mb-4">
                   Widget Position Preview
                 </label>
                 <div className="relative bg-gray-100 rounded-xl h-64 border-2 border-dashed border-gray-300 overflow-hidden">
                   {/* Simulated browser window */}
                   <div className="absolute top-2 left-2 right-2 h-6 bg-white rounded-t-lg border-b flex items-center px-3">
                     <div className="flex gap-1">
                       <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                       <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                       <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                     </div>
                     <div className="ml-4 text-xs text-gray-500">Your Website</div>
                   </div>
                   
                   {/* Website content simulation */}
                   <div className="absolute top-8 left-2 right-2 bottom-2 bg-white rounded-b-lg p-4">
                     <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                     <div className="h-2 bg-gray-200 rounded mb-1 w-full"></div>
                     <div className="h-2 bg-gray-200 rounded mb-1 w-5/6"></div>
                     <div className="h-2 bg-gray-200 rounded mb-4 w-2/3"></div>
                     <div className="h-2 bg-gray-200 rounded mb-1 w-4/5"></div>
                     <div className="h-2 bg-gray-200 rounded mb-1 w-full"></div>
                     <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                   </div>
                   
                   {/* Widget Preview */}
                   <div 
                     className={`absolute bg-white border-2 border-indigo-500 rounded-lg shadow-lg transition-all duration-300 ${
                       settings.widgetPosition === 'bottom-right' ? 'bottom-4 right-4 w-24 h-16' :
                       settings.widgetPosition === 'bottom-left' ? 'bottom-4 left-4 w-24 h-16' :
                       settings.widgetPosition === 'top-right' ? 'top-10 right-4 w-24 h-16' :
                       settings.widgetPosition === 'top-left' ? 'top-10 left-4 w-24 h-16' :
                       settings.widgetPosition === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-20' :
                       settings.widgetPosition === 'slide-up' ? 'bottom-4 left-1/2 transform -translate-x-1/2 w-28 h-16' :
                       settings.widgetPosition === 'slide-down' ? 'top-10 left-1/2 transform -translate-x-1/2 w-28 h-16' :
                       'bottom-4 right-4 w-24 h-16'
                     }`}
                   >
                     <div className="p-2 text-center">
                       <div className="text-xs font-medium text-indigo-600 mb-1">NPS Survey</div>
                       <div className="flex justify-center gap-1">
                         {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                           <div key={n} className="w-1 h-1 bg-gray-300 rounded-full"></div>
                         ))}
                       </div>
                     </div>
                   </div>
                   
                   {/* Position Label */}
                   <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                     {settings.widgetPosition === 'bottom-right' ? 'Bottom Right' :
                      settings.widgetPosition === 'bottom-left' ? 'Bottom Left' :
                      settings.widgetPosition === 'top-right' ? 'Top Right' :
                      settings.widgetPosition === 'top-left' ? 'Top Left' :
                      settings.widgetPosition === 'center' ? 'Center Modal' :
                      settings.widgetPosition === 'slide-up' ? 'Slide Up' :
                      settings.widgetPosition === 'slide-down' ? 'Slide Down' :
                      'Bottom Right'}
                   </div>
                   
                   {/* Delay Indicator */}
                   <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                     Delay: {settings.widgetDelay / 1000}s
                   </div>
                 </div>
               </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Widget Position
                  </label>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'bottom-right')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'bottom-right'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Bottom Right</div>
                     <div className="text-xs text-gray-500">Corner position</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'bottom-left')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'bottom-left'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Bottom Left</div>
                     <div className="text-xs text-gray-500">Corner position</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'top-right')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'top-right'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Top Right</div>
                     <div className="text-xs text-gray-500">Corner position</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'top-left')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'top-left'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Top Left</div>
                     <div className="text-xs text-gray-500">Corner position</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'center')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'center'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Center Modal</div>
                     <div className="text-xs text-gray-500">Modal overlay</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'slide-up')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'slide-up'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Slide Up</div>
                     <div className="text-xs text-gray-500">From bottom center</div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('widgetPosition', 'slide-down')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.widgetPosition === 'slide-down'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                     <div className="font-medium mb-1">Slide Down</div>
                     <div className="text-xs text-gray-500">From top center</div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="widgetDelay" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Delay (milliseconds)
                  </label>
                  <input
                    id="widgetDelay"
                    type="number"
                    min="0"
                    max="60000"
                    step="1000"
                    value={settings.widgetDelay}
                    onChange={(e) => handleSettingsChange('widgetDelay', parseInt(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How long to wait before showing the widget (0 = immediate, 5000 = 5 seconds)
                  </p>
                </div>
              </div>
            </section>

            {/* URL Targeting Section */}
            <section className="mb-10">
              <h2 className="section-title">URL Targeting</h2>
              <div className="card">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <input
                      id="urlTargetingEnabled"
                      type="checkbox"
                      checked={settings.urlTargeting.enabled}
                      onChange={(e) => handleSettingsChange('urlTargeting', {
                        ...settings.urlTargeting,
                        enabled: e.target.checked
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="urlTargetingEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                      Enable URL targeting
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Control which pages the widget appears on based on URL patterns
                  </p>
                </div>

                {settings.urlTargeting.enabled && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Type
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                          onClick={() => handleSettingsChange('urlTargeting', {
                            ...settings.urlTargeting,
                            targetType: 'all'
                          })}
                          className={`p-4 border rounded-xl text-sm ${
                            settings.urlTargeting.targetType === 'all'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">All Pages</div>
                          <div className="text-xs text-gray-500">Show on every page</div>
                        </button>
                        <button
                          onClick={() => handleSettingsChange('urlTargeting', {
                            ...settings.urlTargeting,
                            targetType: 'specific'
                          })}
                          className={`p-4 border rounded-xl text-sm ${
                            settings.urlTargeting.targetType === 'specific'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">Specific URLs</div>
                          <div className="text-xs text-gray-500">Exact URL matches</div>
                        </button>
                        <button
                          onClick={() => handleSettingsChange('urlTargeting', {
                            ...settings.urlTargeting,
                            targetType: 'contains'
                          })}
                          className={`p-4 border rounded-xl text-sm ${
                            settings.urlTargeting.targetType === 'contains'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">Contains</div>
                          <div className="text-xs text-gray-500">URL contains text</div>
                        </button>
                        <button
                          onClick={() => handleSettingsChange('urlTargeting', {
                            ...settings.urlTargeting,
                            targetType: 'starts-with'
                          })}
                          className={`p-4 border rounded-xl text-sm ${
                            settings.urlTargeting.targetType === 'starts-with'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">Starts With</div>
                          <div className="text-xs text-gray-500">URL starts with text</div>
                        </button>
                        <button
                          onClick={() => handleSettingsChange('urlTargeting', {
                            ...settings.urlTargeting,
                            targetType: 'regex'
                          })}
                          className={`p-4 border rounded-xl text-sm ${
                            settings.urlTargeting.targetType === 'regex'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">Regex Pattern</div>
                          <div className="text-xs text-gray-500">Advanced matching</div>
                        </button>
                      </div>
                    </div>

                    {settings.urlTargeting.targetType !== 'all' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target URLs
                        </label>
                        <div className="space-y-2">
                          {settings.urlTargeting.urls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                  const newUrls = [...settings.urlTargeting.urls];
                                  newUrls[index] = e.target.value;
                                  handleSettingsChange('urlTargeting', {
                                    ...settings.urlTargeting,
                                    urls: newUrls
                                  });
                                }}
                                placeholder={
                                  settings.urlTargeting.targetType === 'specific' ? 'https://example.com/page' :
                                  settings.urlTargeting.targetType === 'contains' ? '/product' :
                                  settings.urlTargeting.targetType === 'starts-with' ? 'https://example.com/blog' :
                                  '.*\/product\/.*'
                                }
                                className="input-field flex-1"
                              />
                              <button
                                onClick={() => {
                                  const newUrls = settings.urlTargeting.urls.filter((_, i) => i !== index);
                                  handleSettingsChange('urlTargeting', {
                                    ...settings.urlTargeting,
                                    urls: newUrls
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove URL"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              handleSettingsChange('urlTargeting', {
                                ...settings.urlTargeting,
                                urls: [...settings.urlTargeting.urls, '']
                              });
                            }}
                            className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            Add URL Pattern
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exclude URLs (Optional)
                      </label>
                      <div className="space-y-2">
                        {settings.urlTargeting.excludeUrls.map((url, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...settings.urlTargeting.excludeUrls];
                                newUrls[index] = e.target.value;
                                handleSettingsChange('urlTargeting', {
                                  ...settings.urlTargeting,
                                  excludeUrls: newUrls
                                });
                              }}
                              placeholder="https://example.com/admin"
                              className="input-field flex-1"
                            />
                            <button
                              onClick={() => {
                                const newUrls = settings.urlTargeting.excludeUrls.filter((_, i) => i !== index);
                                handleSettingsChange('urlTargeting', {
                                  ...settings.urlTargeting,
                                  excludeUrls: newUrls
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove URL"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            handleSettingsChange('urlTargeting', {
                              ...settings.urlTargeting,
                              excludeUrls: [...settings.urlTargeting.excludeUrls, '']
                            });
                          }}
                          className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Add Exclude Pattern
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        URLs that match these patterns will never show the widget
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="spaMode"
                        type="checkbox"
                        checked={settings.urlTargeting.spaMode}
                        onChange={(e) => handleSettingsChange('urlTargeting', {
                          ...settings.urlTargeting,
                          spaMode: e.target.checked
                        })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="spaMode" className="ml-2 block text-sm text-gray-700">
                        Single Page Application (SPA) Mode
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Enable for React, Vue, Angular apps that change URLs without page reloads
                    </p>
                  </>
                )}
              </div>
            </section>
            {/* Appearance Settings */}
            <section className="mb-10">
              <h2 className="section-title">Appearance</h2>
              <div className="card">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Selector Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSettingsChange('selectorType', 'zero-to-ten')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.selectorType === 'zero-to-ten'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-2">Zero to Ten (Standard)</div>
                      <div className="flex gap-1 justify-center">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <div key={n} className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">
                            {n}
                          </div>
                        ))}
                      </div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('selectorType', 'one-to-five')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.selectorType === 'one-to-five'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-2">One to Five</div>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div key={n} className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {n}
                          </div>
                        ))}
                      </div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('selectorType', 'three-emoji')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.selectorType === 'three-emoji'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-2">Three Emoji</div>
                      <div className="flex gap-4 justify-center text-2xl">
                        <span>😞</span>
                        <span>😐</span>
                        <span>😊</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSettingsChange('selectorType', 'five-emoji')}
                      className={`p-4 border rounded-xl text-sm ${
                        settings.selectorType === 'five-emoji'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-2">Five Emoji</div>
                      <div className="flex gap-2 justify-center text-xl">
                        <span>😡</span>
                        <span>😞</span>
                        <span>😐</span>
                        <span>🙂</span>
                        <span>😊</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Palette
                  </label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        id="colorPaletteMulti"
                        type="radio"
                        value="multicolor"
                        checked={settings.colorPalette === 'multicolor'}
                        onChange={() => handleSettingsChange('colorPalette', 'multicolor')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="colorPaletteMulti" className="ml-2 block text-sm text-gray-700">
                        Color coded
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="colorPalettePlain"
                        type="radio"
                        value="plain"
                        checked={settings.colorPalette === 'plain'}
                        onChange={() => handleSettingsChange('colorPalette', 'plain')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="colorPalettePlain" className="ml-2 block text-sm text-gray-700">
                        Plain
                      </label>
                    </div>
                  </div>
                </div>
                
                {settings.colorPalette === 'multicolor' && (
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <label htmlFor="detractorColor" className="block text-sm font-medium text-gray-700 mb-2">
                        Detractors Color (0-6)
                      </label>
                      <input
                        id="detractorColor"
                        type="color"
                        value={settings.colors.detractors}
                        onChange={(e) => handleSettingsChange('colors.detractors', e.target.value)}
                        className="h-10 w-full rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor="passiveColor" className="block text-sm font-medium text-gray-700 mb-2">
                        Passives Color (7-8)
                      </label>
                      <input
                        id="passiveColor"
                        type="color"
                        value={settings.colors.passives}
                        onChange={(e) => handleSettingsChange('colors.passives', e.target.value)}
                        className="h-10 w-full rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor="promoterColor" className="block text-sm font-medium text-gray-700 mb-2">
                        Promoters Color (9-10)
                      </label>
                      <input
                        id="promoterColor"
                        type="color"
                        value={settings.colors.promoters}
                        onChange={(e) => handleSettingsChange('colors.promoters', e.target.value)}
                        className="h-10 w-full rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex items-center">
                    <input
                      id="roundedCorners"
                      type="checkbox"
                      checked={settings.roundedCorners}
                      onChange={(e) => handleSettingsChange('roundedCorners', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="roundedCorners" className="ml-2 block text-sm text-gray-700">
                      Rounded corners
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="highlightBorder"
                      type="checkbox"
                      checked={settings.highlightBorder}
                      onChange={(e) => handleSettingsChange('highlightBorder', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="highlightBorder" className="ml-2 block text-sm text-gray-700">
                      Highlight border
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="progressBar"
                      type="checkbox"
                      checked={settings.progressBar}
                      onChange={(e) => handleSettingsChange('progressBar', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="progressBar" className="ml-2 block text-sm text-gray-700">
                      Show progress bar
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="closeButton"
                      type="checkbox"
                      checked={settings.closeButton}
                      onChange={(e) => handleSettingsChange('closeButton', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="closeButton" className="ml-2 block text-sm text-gray-700">
                      Show close button
                    </label>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Button Text Section */}
            <section className="mb-10">
              <h2 className="section-title">Button Text</h2>
              <div className="card">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="backButtonText" className="block text-sm font-medium text-gray-700 mb-2">
                      Back Button
                    </label>
                    <input
                      id="backButtonText"
                      type="text"
                      value={settings.backButtonText}
                      onChange={(e) => handleSettingsChange('backButtonText', e.target.value)}
                      className="input-field"
                      placeholder="Back"
                    />
                  </div>
                  <div>
                    <label htmlFor="continueButtonText" className="block text-sm font-medium text-gray-700 mb-2">
                      Continue Button
                    </label>
                    <input
                      id="continueButtonText"
                      type="text"
                      value={settings.continueButtonText}
                      onChange={(e) => handleSettingsChange('continueButtonText', e.target.value)}
                      className="input-field"
                      placeholder="Submit"
                    />
                  </div>
                  <div>
                    <label htmlFor="skipButtonText" className="block text-sm font-medium text-gray-700 mb-2">
                      Skip Button
                    </label>
                    <input
                      id="skipButtonText"
                      type="text"
                      value={settings.skipButtonText}
                      onChange={(e) => handleSettingsChange('skipButtonText', e.target.value)}
                      className="input-field"
                      placeholder="Skip"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Preview */}
        {showPreview && (
          <div className="w-1/3 border-l bg-[#F9FAFB] p-8 overflow-y-auto">
            <div className="sticky top-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreviewSection('nps-question')}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      previewSection === 'nps-question'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Step 1
                  </button>
                  <button
                    onClick={() => setPreviewSection('feedback-question')}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      previewSection === 'feedback-question'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Step 2
                  </button>
                  <button
                    onClick={() => setPreviewSection('thank-you')}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      previewSection === 'thank-you'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Step 3
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <SharedPreview
                  openSection={previewSection}
                  npsQuestion={settings.npsQuestion}
                  npsExplanation={settings.npsExplanation}
                  feedbackQuestion={settings.feedbackQuestion}
                  feedbackExplanation={settings.feedbackExplanation}
                  startLabel={settings.startLabel}
                  endLabel={settings.endLabel}
                  colors={settings.colors}
                  colorPalette={settings.colorPalette}
                  onScoreClick={handleScoreClick}
                  onBackClick={handleBackClick}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  score={previewScore}
                  maxLength={settings.maxLength}
                  backButtonText={settings.backButtonText}
                  continueButtonText={settings.continueButtonText}
                  skipButtonText={settings.skipButtonText}
                  feedbackText={feedbackText}
                  setFeedbackText={setFeedbackText}
                  thankYouTitle={settings.thankYouTitle}
                  thankYouDescription={settings.thankYouDescription}
                  autoFadeOut={settings.autoFadeOut}
                  fadeOutDelay={settings.fadeOutDelay}
                  roundedCorners={settings.roundedCorners}
                  highlightBorder={settings.highlightBorder}
                  progressBar={settings.progressBar}
                  closeButton={settings.closeButton}
                  isMandatory={settings.isMandatory}
                  feedbackType={settings.feedbackType}
                  predefinedOptions={settings.predefinedOptions}
                  multipleChoiceOptions={settings.multipleChoiceOptions}
                  selectorType={settings.selectorType}
                />
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={resetPreview}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Reset Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPSEditor;