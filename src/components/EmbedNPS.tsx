import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Eye, Code, Globe, Zap } from 'lucide-react';

interface Survey {
  id: string;
  name: string;
  status: 'draft' | 'published';
  created_at: string;
  responses?: number;
  score?: number;
}

interface EmbedNPSProps {
  surveys: Survey[];
}

const EmbedNPS: React.FC<EmbedNPSProps> = ({ surveys }) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'universal' | 'specific'>('universal');

  const publishedSurveys = surveys.filter(survey => survey.status === 'published');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getUniversalEmbedCode = () => {
    const baseUrl = 'https://melodic-melba-d65cd6.netlify.app';
    return `<!-- Universal NPS Widget - Shows ALL Published Surveys -->
<script>
  (function() {
    var npsScript = document.createElement('script');
    npsScript.src = "${baseUrl}/nps-universal.js";
    npsScript.setAttribute('data-position', "bottom-right");
    npsScript.setAttribute('data-delay', "5000");
    npsScript.setAttribute('data-auto-rotate', "true");
    npsScript.setAttribute('data-show-once', "false");
    document.head.appendChild(npsScript);
  })();
</script>`;
  };

  const getSpecificEmbedCode = (survey: Survey) => {
    const baseUrl = 'https://melodic-melba-d65cd6.netlify.app';
    return `<!-- Specific Survey Widget -->
<script>
  (function() {
    var npsScript = document.createElement('script');
    npsScript.src = "${baseUrl}/nps-widget.js";
    npsScript.setAttribute('data-survey-id', "${survey.id}");
    npsScript.setAttribute('data-position', "bottom-right");
    npsScript.setAttribute('data-delay', "3000");
    document.head.appendChild(npsScript);
  })();
</script>`;
  };

  const openDemoWebsite = () => {
    window.open('/demo', '_blank');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>Embed NPS Surveys</h1>
          <p className="text-gray-500 mt-2">
            One simple code to automatically show all your published NPS surveys
          </p>
        </div>
        <button
          onClick={openDemoWebsite}
          className="btn-primary"
        >
          <Globe size={18} />
          View Demo Website
        </button>
      </div>

      {publishedSurveys.length === 0 ? (
        <div className="card text-center py-16">
          <Code size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-gray-500 mb-4">No Published Surveys</h2>
          <p className="text-gray-400 mb-8">
            You need to publish at least one survey before you can embed it on your website.
          </p>
          <p className="text-sm text-gray-500">
            Go to Dashboard → Create/Edit Survey → Publish to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Universal Embed - Main Feature */}
          <div className="card border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                <Zap size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-indigo-900">Universal NPS Widget</h2>
                <p className="text-indigo-700">One code for all your published surveys - automatically updated!</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Universal Embed Code</h3>
                <button
                  onClick={() => handleCopy(getUniversalEmbedCode())}
                  className="btn-secondary"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                <pre className="text-green-400 text-sm whitespace-pre-wrap">
                  <code>{getUniversalEmbedCode()}</code>
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-3">✨ Smart Features</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Automatically shows ALL published surveys</li>
                  <li>• No need to update code when you publish new surveys</li>
                  <li>• Auto-rotates between multiple surveys</li>
                  <li>• Remembers if user already responded</li>
                  <li>• Responsive and mobile-friendly</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-3">⚙️ Customization Options</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">data-position</code>: bottom-right, bottom-left, top-right, top-left, center</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">data-delay</code>: Delay in milliseconds (default: 5000)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">data-auto-rotate</code>: true/false (rotate between surveys)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">data-show-once</code>: true/false (show only once per user)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Published Surveys */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Currently Published Surveys</h2>
            <p className="text-gray-600 mb-6">
              These surveys will automatically appear with the universal widget above:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="p-4 border border-green-200 bg-green-50 rounded-xl"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <h3 className="font-medium text-gray-900">{survey.name}</h3>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{survey.responses || 0} responses</span>
                    <span>NPS: {survey.score || 0}</span>
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-lg">
                      Auto-included
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Guide */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Implementation Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Copy the Code</h3>
                <p className="text-sm text-gray-600">Copy the universal embed code above</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Add to Website</h3>
                <p className="text-sm text-gray-600">Paste before the closing &lt;/body&gt; tag</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Publish Surveys</h3>
                <p className="text-sm text-gray-600">New surveys automatically appear!</p>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Advanced Configuration</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 mb-4">Custom Configuration Example:</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
                    <code>{`<script>
  (function() {
    var npsScript = document.createElement('script');
    npsScript.src = "https://melodic-melba-d65cd6.netlify.app/nps-universal.js";
    npsScript.setAttribute('data-position', "top-right");
    npsScript.setAttribute('data-delay', "10000");        // 10 seconds
    npsScript.setAttribute('data-auto-rotate', "false");  // Don't rotate
    npsScript.setAttribute('data-show-once', "true");     // Show only once
    document.head.appendChild(npsScript);
  })();
</script>`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How does the universal widget know which surveys to show?</h4>
                <p className="text-sm text-gray-600">It automatically detects all surveys with "published" status and displays them to users.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What happens when I publish a new survey?</h4>
                <p className="text-sm text-gray-600">The widget automatically includes new published surveys without any code changes needed.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Can I control which surveys appear?</h4>
                <p className="text-sm text-gray-600">Yes! Simply change the survey status to "draft" to remove it from the widget, or "published" to include it.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Will users see the same survey multiple times?</h4>
                <p className="text-sm text-gray-600">No, the widget remembers user responses and can be configured to show surveys only once per user.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedNPS;