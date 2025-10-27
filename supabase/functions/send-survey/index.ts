import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend('re_9qWFAeJh_tSAVPTAjDaUUfUGXGoXKQjKW');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, recipientEmail, surveyName } = await req.json();

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || 'https://stackblitz.com';
    const surveyUrl = `${origin}/s/${surveyId}`;

    const { error } = await resend.emails.send({
      from: 'NPS Survey <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Please share your feedback - ${surveyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>We value your feedback!</h2>
          <p>We would greatly appreciate your feedback about our product/service.</p>
          <p style="margin: 24px 0;">
            <a href="${surveyUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Take the Survey
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This survey will only take a minute of your time.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${surveyUrl}" style="color: #4F46E5; word-break: break-all;">${surveyUrl}</a>
          </p>
        </div>
      `
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});