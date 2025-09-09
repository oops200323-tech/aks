const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Widget-Version, X-Widget-Origin, apikey, x-api-key',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const apiKey = event.headers['x-api-key'] || 
                   event.headers['authorization']?.replace('Bearer ', '') ||
                   event.headers['apikey'];
    
    if (!apiKey) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    // Parse request body
    const { surveyId, score, feedback } = JSON.parse(event.body || '{}');
    
    if (!surveyId || score === undefined) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'surveyId and score are required' })
      };
    }

    // Validate score range
    if (score < 0 || score > 10) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Score must be between 0 and 10' })
      };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key using the database function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_api_key', {
      p_key_value: apiKey
    });

    if (validationError || !validationResult || validationResult.length === 0 || !validationResult[0].is_valid) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid API key' })
      };
    }

    const userId = validationResult[0].user_id;

    // Verify survey belongs to user and is published
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, user_id, status')
      .eq('id', surveyId)
      .eq('user_id', userId)
      .eq('status', 'published')
      .single();

    if (surveyError || !survey) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Survey not found or not accessible' })
      };
    }

    // Insert survey response
    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        score,
        feedback: feedback || null
      })
      .select()
      .single();

    if (responseError) {
      throw responseError;
    }

    // Update survey stats
    const { error: statsError } = await supabase.rpc('update_survey_stats', {
      p_survey_id: surveyId,
      new_score: score
    });

    if (statsError) {
      console.error('Failed to update survey stats:', statsError);
      // Don't fail the request if stats update fails
    }

    // Get client info for analytics
    const clientInfo = {
      userAgent: event.headers['user-agent'],
      origin: event.headers['x-widget-origin'] || event.headers['origin'],
      widgetVersion: event.headers['x-widget-version'],
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        responseId: response.id,
        message: 'Response submitted successfully',
        clientInfo
      })
    };
  } catch (error) {
    console.error('Submit response error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to submit response' })
    };
  }
};