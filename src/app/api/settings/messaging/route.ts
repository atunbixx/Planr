import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Load current configuration
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is part of a couple (admin access)
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get configuration from couple settings
    const { data: settings, error: settingsError } = await supabase
      .from('couple_settings')
      .select('external_messaging_config')
      .eq('couple_id', couple.id)
      .single();

    // Return configuration (masked for security)
    const config = settings?.external_messaging_config || {};
    const maskedConfig = {
      TWILIO_ACCOUNT_SID: config.TWILIO_ACCOUNT_SID ? '***' + config.TWILIO_ACCOUNT_SID.slice(-4) : '',
      TWILIO_AUTH_TOKEN: config.TWILIO_AUTH_TOKEN ? '***' : '',
      TWILIO_PHONE_NUMBER: config.TWILIO_PHONE_NUMBER || '',
      TWILIO_WHATSAPP_NUMBER: config.TWILIO_WHATSAPP_NUMBER || '',
      RESEND_API_KEY: config.RESEND_API_KEY ? '***' + config.RESEND_API_KEY.slice(-4) : '',
      RESEND_FROM_EMAIL: config.RESEND_FROM_EMAIL || '',
      RESEND_WEBHOOK_SECRET: config.RESEND_WEBHOOK_SECRET ? '***' : '',
      SMS_ENABLED: config.SMS_ENABLED ?? true,
      WHATSAPP_ENABLED: config.WHATSAPP_ENABLED ?? false,
      EMAIL_ENABLED: config.EMAIL_ENABLED ?? true
    };

    // Check service status
    const twilioStatus = {
      connected: !!(config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN),
      error: null
    };

    const resendStatus = {
      connected: !!config.RESEND_API_KEY,
      error: null
    };

    return NextResponse.json({
      config: maskedConfig,
      twilioStatus,
      resendStatus
    });

  } catch (error) {
    console.error('Error loading messaging configuration:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

// POST: Save configuration
export async function POST(request: NextRequest) {
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

    const { config } = await request.json();

    // Validate required fields
    if (config.SMS_ENABLED || config.WHATSAPP_ENABLED) {
      if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
        return NextResponse.json(
          { error: 'Twilio credentials required for SMS/WhatsApp' },
          { status: 400 }
        );
      }
    }

    if (config.EMAIL_ENABLED && !config.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key required for email' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('couple_settings')
      .select('id')
      .eq('couple_id', couple.id)
      .single();

    // Save configuration
    const settingsData = {
      couple_id: couple.id,
      external_messaging_config: config,
      updated_at: new Date().toISOString()
    };

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('couple_settings')
        .update(settingsData)
        .eq('couple_id', couple.id);

      if (updateError) throw updateError;
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('couple_settings')
        .insert(settingsData);

      if (insertError) throw insertError;
    }

    // Also update environment variables for the current session
    if (config.TWILIO_ACCOUNT_SID) process.env.TWILIO_ACCOUNT_SID = config.TWILIO_ACCOUNT_SID;
    if (config.TWILIO_AUTH_TOKEN) process.env.TWILIO_AUTH_TOKEN = config.TWILIO_AUTH_TOKEN;
    if (config.TWILIO_PHONE_NUMBER) process.env.TWILIO_PHONE_NUMBER = config.TWILIO_PHONE_NUMBER;
    if (config.TWILIO_WHATSAPP_NUMBER) process.env.TWILIO_WHATSAPP_NUMBER = config.TWILIO_WHATSAPP_NUMBER;
    if (config.RESEND_API_KEY) process.env.RESEND_API_KEY = config.RESEND_API_KEY;
    if (config.RESEND_FROM_EMAIL) process.env.RESEND_FROM_EMAIL = config.RESEND_FROM_EMAIL;
    if (config.RESEND_WEBHOOK_SECRET) process.env.RESEND_WEBHOOK_SECRET = config.RESEND_WEBHOOK_SECRET;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving messaging configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}