import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SharedPreview from './SharedPreview';

interface SurveyParams {
  surveyId: string;
}

const SurveyPage: React.FC = () => {
  const { surveyId } = useParams<keyof SurveyParams>();
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'nps-question' | 'feedback-question' | 'thank-you'>('nps-question');
  const [score, setScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  
  const isEmbed = searchParams.get('embed') === 'true';
  const isWidget = searchParams.get('widget') === 'true';
  
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) {
        setError('Invalid survey ID');
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('surveys')
          .select('settings, name')
          .eq('id', surveyId)
          .eq('status', 'published')
          .single();

        if (queryError) {
          // Handle specific case when no survey is found
          if (queryError.code === 'PGRST116') {
            setError('Survey not found or not published');
          } else {
            setError(`Failed to load survey: ${queryError.message}`);
          }
          setLoading(false);
          return;
        }
        
        if (!data) {
          setError('Survey not found or not published');
          setLoading(false);
          return;
        }

        setSettings(data.settings);
      } catch (err: any) {
        console.error('Error fetching survey:', err);
        
        // Check if the error has the PGRST116 code indicating no rows found
        if (err?.code === 'PGRST116' || err?.message?.includes('PGRST116')) {
          setError('Survey not found or not published');
        } else {
          setError('Failed to load survey');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleScoreSubmit = (value: number) => {
    setScore(value);
    setStep('feedback-question');
  };

  const handleBackClick = () => {
    setStep('nps-question');
  };

  const handleFeedbackSubmit = async () => {
    if (!surveyId || score === null) return;
    
    try {
      setLoading(true);
      
      // Store the response
      const { error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          score,
          feedback: feedbackText || null
        });

      if (responseError) throw responseError;

      // Update survey stats
      const { error: statsError } = await supabase.rpc('update_survey_stats', {
        p_survey_id: surveyId,
        new_score: score
      });

      if (statsError) throw statsError;
      
      setStep('thank-you');

      // Auto-hide after delay if enabled
      if (settings.autoFadeOut) {
        setTimeout(() => {
          if (isWidget && window.parent) {
            // If in widget, close the widget
            window.parent.postMessage({ type: 'close-widget' }, '*');
          } else {
            window.close();
          }
        }, (settings.fadeOutDelay || 3) * 1000);
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to submit response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isEmbed ? 'p-4' : 'min-h-screen'} flex items-center justify-center bg-gray-50`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isEmbed ? 'p-4' : 'min-h-screen'} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={`${isEmbed ? 'p-4' : 'min-h-screen'} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Survey Not Found</h1>
          <p className="text-gray-600">The survey you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const containerClass = isEmbed 
    ? "flex items-center justify-center p-4" 
    : "min-h-screen flex items-center justify-center bg-gray-50 p-4";

  return (
    <div className={containerClass}>
      <SharedPreview
        openSection={step}
        npsQuestion={settings.npsQuestion}
        npsExplanation={settings.npsExplanation}
        feedbackQuestion={settings.feedbackQuestion}
        feedbackExplanation={settings.feedbackExplanation}
        startLabel={settings.startLabel}
        endLabel={settings.endLabel}
        colors={settings.colors}
        colorPalette={settings.colorPalette}
        onScoreClick={handleScoreSubmit}
        onBackClick={handleBackClick}
        onFeedbackSubmit={handleFeedbackSubmit}
        score={score}
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
        closeButton={settings.closeButton && !isEmbed}
        isMandatory={settings.isMandatory}
        feedbackType={settings.feedbackType}
        predefinedOptions={settings.predefinedOptions}
        multipleChoiceOptions={settings.multipleChoiceOptions}
        selectorType={settings.selectorType}
      />
    </div>
  );
};

export default SurveyPage;