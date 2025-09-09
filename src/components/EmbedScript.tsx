import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface EmbedScriptProps {
  survey: any;
}

const EmbedScript: React.FC<EmbedScriptProps> = ({ survey }) => {
  const [copied, setCopied] = useState(false);

  if (!survey) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h1>Embed Scripts</h1>
          <p className="text-gray-500 mt-4">
            Select a published survey from the dashboard to get the embed code
          </p>
        </div>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const surveyUrl = `${baseUrl}/survey/${survey.id}`;
  
  const popupEmbedCode = `<script>
  (function() {
    // Add NPS Survey Widget
    var npsScript = document.createElement('script');
    npsScript.src = "${baseUrl}/nps-widget.js";
    npsScript.setAttribute('data-survey-id', "${survey.id}");
    npsScript.setAttribute('data-position', "bottom-right");
    npsScript.setAttribute('data-delay', "3000"); // Show after 3 seconds
    document.head.appendChild(npsScript);
  })();
</script>`;

  const inlineEmbedCode = `<div id="nps-survey-${survey.id}"></div>
<script>
  (function() {
    // Load NPS Survey Inline
    var npsScript = document.createElement('script');
    npsScript.src = "${baseUrl}/nps-inline.js";
    npsScript.setAttribute('data-survey-id', "${survey.id}");
    npsScript.setAttribute('data-container', "nps-survey-${survey.id}");
    document.head.appendChild(npsScript);
  })();
</script>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1>Embed Your Survey</h1>
        <p className="text-gray-500 mt-2">
          Add your NPS survey to your website with the following options
        </p>
      </div>

      {/* Direct Link */}
      <section className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Direct Link</h2>
        <p className="text-gray-600 mb-4">
          Share this link directly with your customers via email or other channels.
        </p>
        <div className="flex">
          <input
            type="text"
            value={surveyUrl}
            readOnly
            className="input-field rounded-r-none flex-1"
          />
          <button
            onClick={() => handleCopy(surveyUrl)}
            className="px-4 bg-indigo-50 border border-l-0 border-gray-200 text-indigo-600 hover:bg-indigo-100 transition-colors rounded-r-xl flex items-center"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </section>

      {/* Popup Widget Embed */}
      <section className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Popup Widget</h2>
        <p className="text-gray-600 mb-4">
          Add a popup that appears after a set delay. Great for websites and web applications.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 overflow-x-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{popupEmbedCode}</pre>
        </div>
        <button
          onClick={() => handleCopy(popupEmbedCode)}
          className="btn-secondary"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          Copy Embed Code
        </button>
      </section>

      {/* Inline Embed */}
      <section className="card">
        <h2 className="text-xl font-semibold mb-6">Inline Embed</h2>
        <p className="text-gray-600 mb-4">
          Embed the survey directly in your webpage at a specific location.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 overflow-x-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{inlineEmbedCode}</pre>
        </div>
        <button
          onClick={() => handleCopy(inlineEmbedCode)}
          className="btn-secondary"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          Copy Embed Code
        </button>
      </section>
    </div>
  );
};

export default EmbedScript;