const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Fetch published surveys for this user
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('id, name, settings, responses, score, created_at')
      .eq('status', 'published')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        surveys: surveys || [],
        count: surveys?.length || 0,
        userId: userId
      })
    };
  } catch (error) {
    console.error('Error fetching published surveys:', error);
    return {
      statusCode: error.message.includes('Invalid API key') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false,
        error: error.message,
        surveys: [],
        count: 0
      })
    };
  }
};