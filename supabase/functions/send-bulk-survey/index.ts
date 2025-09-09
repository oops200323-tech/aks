import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend('re_9qWFAeJh_tSAVPTAjDaUUfUGXGoXKQjKW');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Recipient {
  id: string;
  name: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, recipients, surveyName } = await req.json();
    
    if (!surveyId || !recipients || !Array.isArray(recipients)) {
      throw new Error('Missing required fields: surveyId, recipients');
    }

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || 'https://stackblitz.com';
    const surveyUrl = `${origin}/s/${surveyId}`;

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient: Recipient) => {
        try {
          const personalizedSubject = recipient.name 
            ? `Hi ${recipient.name}, please share your feedback - ${surveyName}`
            : `Please share your feedback - ${surveyName}`;

          const personalizedGreeting = recipient.name 
            ? `Hi ${recipient.name},`
            : 'Hello,';

          const { data, error } = await resend.emails.send({
            from: 'NPS Survey <onboarding@resend.dev>',
            to: recipient.email,
            subject: personalizedSubject,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 600;">NPS Survey</h1>
                </div>
                
                <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">We value your feedback!</h2>
                  
                  <p style="color: #4B5563; margin: 0 0 16px 0; line-height: 1.6;">
                    ${personalizedGreeting}
                  </p>
                  
                  <p style="color: #4B5563; margin: 0 0 24px 0; line-height: 1.6;">
                    We would greatly appreciate your feedback about our product/service. Your input helps us improve and provide better experiences for all our customers.
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${surveyUrl}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 14px 28px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              display: inline-block; 
                              font-weight: 600;
                              font-size: 16px;
                              box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);">
                      Take the Survey
                    </a>
                  </div>
                  
                  <p style="color: #6B7280; font-size: 14px; margin: 24px 0 0 0; line-height: 1.5;">
                    This survey will only take a minute of your time and your responses are completely confidential.
                  </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px 0;">
                    If the button above doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color: #4F46E5; font-size: 12px; margin: 0; word-break: break-all;">
                    <a href="${surveyUrl}" style="color: #4F46E5; text-decoration: none;">${surveyUrl}</a>
                  </p>
                </div>
              </div>
            `
          });

          if (error) {
            console.error(`Failed to send email to ${recipient.email}:`, error);
            return { email: recipient.email, success: false, error: error.message };
          }

          return { email: recipient.email, success: true, messageId: data?.id };
        } catch (error) {
          console.error(`Error sending email to ${recipient.email}:`, error);
          return { email: recipient.email, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({ 
      success: true,
      totalSent: successCount,
      totalFailed: failureCount,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});