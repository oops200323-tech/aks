import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Widget-Version, X-Widget-Origin, apikey',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = req.headers.get('X-API-Key') || 
                   req.headers.get('Authorization')?.replace('Bearer ', '') ||
                   req.headers.get('apikey');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { surveyId, score, feedback } = await req.json();
    
    if (!surveyId || score === undefined) {
      return new Response(
        JSON.stringify({ error: 'surveyId and score are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate score range
    if (score < 0 || score > 10) {
      return new Response(
        JSON.stringify({ error: 'Score must be between 0 and 10' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key using the database function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_api_key', {
      p_key_value: apiKey
    });

    if (validationError || !validationResult || validationResult.length === 0 || !validationResult[0].is_valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = validationResult[0].user_id;

    // Verify survey belongs to user and is published
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, user_id, status')
      .eq('id', surveyId)
      .eq('user_id', userId)
      .eq('status', 'published')
      .maybeSingle();

    if (surveyError || !survey) {
      return new Response(
        JSON.stringify({ error: 'Survey not found or not accessible' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
      userAgent: req.headers.get('User-Agent'),
      origin: req.headers.get('X-Widget-Origin') || req.headers.get('Origin'),
      widgetVersion: req.headers.get('X-Widget-Version'),
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        responseId: response.id,
        message: 'Response submitted successfully',
        clientInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Submit response error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit response' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});