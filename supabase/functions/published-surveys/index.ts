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

    return new Response(
      JSON.stringify({ 
        success: true,
        surveys: surveys || [],
        count: surveys?.length || 0,
        userId: userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching published surveys:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        surveys: [],
        count: 0
      }),
      { 
        status: error.message.includes('Invalid API key') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});