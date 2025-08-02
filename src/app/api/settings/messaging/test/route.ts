import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import twilio from 'twilio';
import { Resend } from 'resend';

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
      .select('id, name')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { service, config } = await request.json();

    if (service === 'twilio') {
      // Test Twilio connection
      if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
        return NextResponse.json({
          success: false,
          message: 'Missing Twilio credentials'
        });
      }

      try {
        const twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        
        // Verify account
        const account = await twilioClient.api.v2010.accounts(config.TWILIO_ACCOUNT_SID).fetch();
        
        if (account.status !== 'active') {
          return NextResponse.json({
            success: false,
            message: `Twilio account is ${account.status}`
          });
        }

        // Test SMS capability if enabled
        if (config.SMS_ENABLED && config.TWILIO_PHONE_NUMBER) {
          try {
            // Verify the phone number exists
            const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
            const hasNumber = phoneNumbers.some(p => p.phoneNumber === config.TWILIO_PHONE_NUMBER);
            
            if (!hasNumber) {
              return NextResponse.json({
                success: false,
                message: 'Phone number not found in your Twilio account'
              });
            }

            // Optionally send a test SMS to yourself
            // await twilioClient.messages.create({
            //   body: `Test message from ${couple.name || 'Wedding Planner'}`,
            //   from: config.TWILIO_PHONE_NUMBER,
            //   to: config.TWILIO_PHONE_NUMBER // Send to self for testing
            // });
          } catch (error: any) {
            return NextResponse.json({
              success: false,
              message: `SMS test failed: ${error.message}`
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Twilio connection successful',
          details: {
            accountStatus: account.status,
            friendlyName: account.friendlyName
          }
        });

      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.message || 'Failed to connect to Twilio'
        });
      }
    }

    if (service === 'resend') {
      // Test Resend connection
      if (!config.RESEND_API_KEY) {
        return NextResponse.json({
          success: false,
          message: 'Missing Resend API key'
        });
      }

      try {
        const resend = new Resend(config.RESEND_API_KEY);
        
        // Verify API key by fetching domains
        const { data: domains, error } = await resend.domains.list();
        
        if (error) {
          return NextResponse.json({
            success: false,
            message: error.message || 'Invalid Resend API key'
          });
        }

        // Check if from email domain is verified
        if (config.RESEND_FROM_EMAIL) {
          const fromDomain = config.RESEND_FROM_EMAIL.split('@')[1];
          const verifiedDomain = domains?.data.find(d => 
            d.name === fromDomain && d.status === 'verified'
          );

          if (!verifiedDomain) {
            return NextResponse.json({
              success: false,
              message: `Domain ${fromDomain} is not verified in Resend`
            });
          }
        }

        // Optionally send a test email
        // if (config.EMAIL_ENABLED && config.RESEND_FROM_EMAIL) {
        //   const { data: email, error: emailError } = await resend.emails.send({
        //     from: config.RESEND_FROM_EMAIL,
        //     to: config.RESEND_FROM_EMAIL, // Send to self for testing
        //     subject: 'Test Email from Wedding Planner',
        //     text: `This is a test email from ${couple.name || 'Wedding Planner'}`
        //   });

        //   if (emailError) {
        //     return NextResponse.json({
        //       success: false,
        //       message: `Email test failed: ${emailError.message}`
        //     });
        //   }
        // }

        return NextResponse.json({
          success: true,
          message: 'Resend connection successful',
          details: {
            domains: domains?.data.map(d => d.name) || []
          }
        });

      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.message || 'Failed to connect to Resend'
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid service specified'
    });

  } catch (error) {
    console.error('Error testing service:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to test service' },
      { status: 500 }
    );
  }
}