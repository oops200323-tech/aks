import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface SharedPreviewProps {
  openSection: 'nps-question' | 'feedback-question' | 'thank-you';
  npsQuestion: string;
  npsExplanation: string;
  feedbackQuestion: string;
  feedbackExplanation: string;
  startLabel: string;
  endLabel: string;
  colors: {
    detractors: string;
    passives: string;
    promoters: string;
  };
  colorPalette: 'plain' | 'multicolor';
  onScoreClick: (score: number) => void;
  onBackClick: () => void;
  onFeedbackSubmit: () => void;
  score: number | null;
  maxLength: number;
  backButtonText: string;
  continueButtonText: string;
  skipButtonText: string;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  thankYouTitle: string;
  thankYouDescription: string;
  autoFadeOut: boolean;
  fadeOutDelay: number;
  roundedCorners: boolean;
  highlightBorder: boolean;
  progressBar: boolean;
  closeButton: boolean;
  isMandatory: boolean;
  feedbackType: 'text' | 'predefined' | 'multiple_choice';
  predefinedOptions: {
    detractors: string[];
    passives: string[];
    promoters: string[];
  };
  multipleChoiceOptions: string[];
  selectorType: 'zero-to-ten' | 'one-to-five' | 'three-emoji' | 'five-emoji';
}

const SharedPreview: React.FC<SharedPreviewProps> = ({
  openSection,
  npsQuestion,
  npsExplanation,
  feedbackQuestion,
  feedbackExplanation,
  startLabel,
  endLabel,
  colors,
  colorPalette,
  onScoreClick,
  onBackClick,
  onFeedbackSubmit,
  score,
  maxLength,
  backButtonText,
  continueButtonText,
  skipButtonText,
  feedbackText,
  setFeedbackText,
  thankYouTitle,
  thankYouDescription,
  autoFadeOut,
  fadeOutDelay,
  roundedCorners,
  highlightBorder,
  progressBar,
  closeButton,
  isMandatory,
  feedbackType,
  predefinedOptions,
  multipleChoiceOptions,
  selectorType
}) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (openSection === 'thank-you' && autoFadeOut) {
      timeoutId = setTimeout(() => {
        // Handle fade out
      }, fadeOutDelay * 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [openSection, autoFadeOut, fadeOutDelay]);

  const getButtonColor = (value: number) => {
    if (colorPalette === 'plain') return '#F3F4F6';
    if (value <= 6) return colors.detractors;
    if (value <= 8) return colors.passives;
    return colors.promoters;
  };

  const containerClasses = `
    bg-white shadow-lg p-8 relative w-full max-w-[400px]
    ${highlightBorder ? 'border-2 border-[#4F46E5]' : ''}
    ${roundedCorners ? 'rounded-xl' : ''}
  `;

  const getFeedbackOptions = () => {
    if (feedbackType === 'predefined' && predefinedOptions) {
      if (score === null) return [];
      if (score <= 6) return predefinedOptions.detractors || [];
      if (score <= 8) return predefinedOptions.passives || [];
      return predefinedOptions.promoters || [];
    }
    return multipleChoiceOptions || [];
  };

  const sanitizeHTML = (html: string) => ({
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'span', 'p', 'br', 'sub', 'sup'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ADD_ATTR: [['target', '_blank'], ['rel', 'noopener noreferrer']],
      ALLOW_DATA_ATTR: false
    })
  });

  const linkBaseStyles = '[&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline [&_a]:cursor-pointer';

  const getStepColor = (step: number) => {
    const currentStep = openSection === 'nps-question' ? 1 : openSection === 'feedback-question' ? 2 : 3;
    return step <= currentStep ? 'bg-indigo-600' : 'bg-gray-200';
  };

  const renderScoreSelector = () => {
    switch (selectorType) {
      case 'zero-to-ten':
        return (
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                onClick={() => onScoreClick(value)}
                className={`w-10 h-10 flex items-center justify-center text-gray-700 transition-all duration-200
                  hover:scale-110 hover:shadow-md active:scale-95 hover:bg-opacity-80
                  ${roundedCorners ? 'rounded-lg' : ''}
                `}
                style={{ 
                  backgroundColor: getButtonColor(value),
                  opacity: score === value ? 1 : 0.7
                }}
              >
                {value}
              </button>
            ))}
          </div>
        );
      
      case 'one-to-five':
        return (
          <div className="flex justify-center gap-4 mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => onScoreClick(value * 2)}
                className={`w-12 h-12 flex items-center justify-center text-gray-700 text-lg font-medium
                  transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95
                  ${roundedCorners ? 'rounded-lg' : ''}
                `}
                style={{ 
                  backgroundColor: getButtonColor(value * 2),
                  opacity: score === value * 2 ? 1 : 0.7
                }}
              >
                {value}
              </button>
            ))}
          </div>
        );
      
      case 'three-emoji':
        return (
          <div className="flex justify-center gap-8 mb-4">
            {[
              { emoji: '😞', value: 3 },
              { emoji: '😐', value: 6 },
              { emoji: '😊', value: 9 }
            ].map(({ emoji, value }) => (
              <button
                key={value}
                onClick={() => onScoreClick(value)}
                className={`w-16 h-16 flex items-center justify-center text-3xl
                  transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95
                  ${roundedCorners ? 'rounded-full' : ''}
                `}
                style={{ 
                  backgroundColor: getButtonColor(value),
                  opacity: score === value ? 1 : 0.7
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        );
      
      case 'five-emoji':
        return (
          <div className="flex justify-center gap-4 mb-4">
            {[
              { emoji: '😡', value: 2 },
              { emoji: '😞', value: 4 },
              { emoji: '😐', value: 6 },
              { emoji: '🙂', value: 8 },
              { emoji: '😊', value: 10 }
            ].map(({ emoji, value }) => (
              <button
                key={value}
                onClick={() => onScoreClick(value)}
                className={`w-14 h-14 flex items-center justify-center text-2xl
                  transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95
                  ${roundedCorners ? 'rounded-full' : ''}
                `}
                style={{ 
                  backgroundColor: getButtonColor(value),
                  opacity: score === value ? 1 : 0.7
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      {closeButton && (
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      )}

      {/* Progress Steps */}
      {progressBar && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 mb-4">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${getStepColor(1)}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${getStepColor(2)}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${getStepColor(3)}`} />
        </div>
      )}

      {openSection === 'nps-question' && (
        <>
          <div 
            className={`text-xl font-medium mb-4 text-left ${progressBar ? 'mt-8' : 'mt-4'} ${linkBaseStyles}`}
            dangerouslySetInnerHTML={sanitizeHTML(npsQuestion)}
          />
          
          {npsExplanation && (
            <div 
              className={`text-gray-600 mb-8 text-left ${linkBaseStyles}`}
              dangerouslySetInnerHTML={sanitizeHTML(npsExplanation)}
            />
          )}
          
          {renderScoreSelector()}
          
          <div className="flex justify-between text-sm text-gray-600">
            <span className={linkBaseStyles} dangerouslySetInnerHTML={sanitizeHTML(startLabel)} />
            <span className={linkBaseStyles} dangerouslySetInnerHTML={sanitizeHTML(endLabel)} />
          </div>
        </>
      )}

      {openSection === 'feedback-question' && (
        <>
          <div 
            className={`text-xl font-medium mb-4 text-left ${progressBar ? 'mt-8' : 'mt-4'} ${linkBaseStyles}`}
            dangerouslySetInnerHTML={sanitizeHTML(feedbackQuestion)}
          />
          
          {feedbackExplanation && (
            <div 
              className={`text-gray-600 mb-6 text-left ${linkBaseStyles}`}
              dangerouslySetInnerHTML={sanitizeHTML(feedbackExplanation)}
            />
          )}
          
          <div className="mb-6">
            {feedbackType === 'text' ? (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className={`w-full p-3 border border-gray-200 resize-none h-32 ${
                    roundedCorners ? 'rounded-lg' : ''
                  }`}
                  placeholder="Type your answer here..."
                  maxLength={maxLength}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-sm text-gray-500">
                    {feedbackText.length}/{maxLength}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {getFeedbackOptions().map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setFeedbackText(option)}
                    className={`w-full p-3 text-left transition-colors ${
                      feedbackText === option
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    } border ${roundedCorners ? 'rounded-lg' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBackClick}
              className={`px-4 py-2 text-gray-600 hover:bg-gray-50 ${
                roundedCorners ? 'rounded-lg' : ''
              }`}
            >
              {backButtonText}
            </button>
            <div className="flex gap-2">
              {isMandatory ? (
                <button
                  onClick={onFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                  className={`px-4 py-2 ${
                    roundedCorners ? 'rounded-lg' : ''
                  } ${
                    feedbackText.trim()
                      ? 'bg-[#E8FFEA] text-gray-700 hover:opacity-90' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {continueButtonText}
                </button>
              ) : (
                <>
                  <button
                    onClick={onFeedbackSubmit}
                    className={`px-4 py-2 bg-[#E8FFEA] text-gray-700 hover:opacity-90 ${
                      roundedCorners ? 'rounded-lg' : ''
                    }`}
                  >
                    {continueButtonText}
                  </button>
                  {!feedbackText.trim() && (
                    <button
                      onClick={onFeedbackSubmit}
                      className={`px-4 py-2 text-gray-600 hover:bg-gray-50 ${
                        roundedCorners ? 'rounded-lg' : ''
                      }`}
                    >
                      {skipButtonText}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {openSection === 'thank-you' && (
        <div className={`text-center ${progressBar ? 'mt-8' : 'mt-4'}`}>
          <div 
            className={`text-xl font-medium mb-4 ${linkBaseStyles}`}
            dangerouslySetInnerHTML={sanitizeHTML(thankYouTitle)}
          />
          <div 
            className={`text-gray-600 ${linkBaseStyles}`}
            dangerouslySetInnerHTML={sanitizeHTML(thankYouDescription)}
          />
        </div>
      )}
    </div>
  );
};

export default SharedPreview;