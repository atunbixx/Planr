import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import twilio from 'twilio';
import { Resend } from 'resend';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is part of a couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get configuration
    const { data: settings } = await supabase
      .from('couple_settings')
      .select('external_messaging_config')
      .eq('couple_id', couple.id)
      .single();

    const config = settings?.external_messaging_config || {};

    // Check Twilio status
    let twilioStatus = { connected: false, error: null as string | null, details: {} as any };
    if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
      try {
        const twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        
        // Verify account
        const account = await twilioClient.api.v2010.accounts(config.TWILIO_ACCOUNT_SID).fetch();
        
        // Check phone numbers
        const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 10 });
        
        twilioStatus = {
          connected: true,
          error: null,
          details: {
            accountStatus: account.status,
            phoneNumbers: phoneNumbers.map(p => ({
              number: p.phoneNumber,
              capabilities: {
                sms: p.capabilities.sms,
                voice: p.capabilities.voice,
                mms: p.capabilities.mms
              }
            }))
          }
        };
      } catch (error: any) {
        twilioStatus = {
          connected: false,
          error: error.message || 'Failed to connect to Twilio',
          details: {}
        };
      }
    }

    // Check Resend status
    let resendStatus = { connected: false, error: null as string | null, details: {} as any };
    if (config.RESEND_API_KEY) {
      try {
        const resend = new Resend(config.RESEND_API_KEY);
        
        // Get domains
        const { data: domains, error } = await resend.domains.list();
        
        if (error) {
          throw new Error(error.message);
        }

        resendStatus = {
          connected: true,
          error: null,
          details: {
            domains: domains?.data.map(d => ({
              name: d.name,
              status: d.status,
              verified: d.status === 'verified'
            })) || []
          }
        };
      } catch (error: any) {
        resendStatus = {
          connected: false,
          error: error.message || 'Failed to connect to Resend',
          details: {}
        };
      }
    }

    return NextResponse.json({
      twilio: twilioStatus,
      resend: resendStatus
    });

  } catch (error) {
    console.error('Error checking service status:', error);
    return NextResponse.json(
      { error: 'Failed to check service status' },
      { status: 500 }
    );
  }
}