import { supabase } from '@/lib/supabase'

export interface ReminderResult {
  success: boolean
  sent: number
  failed: number
  errors: string[]
}

export async function sendRSVPReminders(
  coupleId: string,
  guestIds: string[]
): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get guest details
    const { data: guests, error } = await supabase
      .from('wedding_guests')
      .select('id, first_name, last_name, email, invite_code')
      .in('id', guestIds)
      .eq('couple_id', coupleId)
      .eq('rsvp_status', 'pending')
      .not('email', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch guests: ${error.message}`)
    }

    if (!guests || guests.length === 0) {
      return {
        ...result,
        errors: ['No eligible guests found for reminders']
      }
    }

    // In a real implementation, this would send actual emails
    // For now, we'll just log the activity
    for (const guest of guests) {
      try {
        // Log the reminder sent
        await supabase
          .from('activity_feed')
          .insert({
            couple_id: coupleId,
            user_id: coupleId, // Using couple ID as user ID for system actions
            action: 'rsvp_reminder_sent',
            entity_type: 'guest',
            entity_id: guest.id,
            entity_name: `${guest.first_name} ${guest.last_name}`,
            metadata: {
              email: guest.email,
              invite_code: guest.invite_code,
              reminder_type: 'manual'
            }
          })

        // Update reminder sent date
        await supabase
          .from('wedding_guests')
          .update({
            last_reminder_sent: new Date().toISOString(),
            reminder_count: supabase.raw('COALESCE(reminder_count, 0) + 1')
          })
          .eq('id', guest.id)

        result.sent++
      } catch (err) {
        result.failed++
        result.errors.push(`Failed to send reminder to ${guest.first_name} ${guest.last_name}`)
      }
    }

    result.success = result.failed === 0
  } catch (error: any) {
    result.success = false
    result.errors.push(error.message || 'Unknown error occurred')
  }

  return result
}

export async function getEligibleGuestsForReminders(coupleId: string) {
  const { data, error } = await supabase
    .from('wedding_guests')
    .select('id, first_name, last_name, email, last_reminder_sent, reminder_count')
    .eq('couple_id', coupleId)
    .eq('rsvp_status', 'pending')
    .not('email', 'is', null)
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error fetching eligible guests:', error)
    return []
  }

  // Filter out guests who received a reminder in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return (data || []).filter(guest => {
    if (!guest.last_reminder_sent) return true
    return new Date(guest.last_reminder_sent) < sevenDaysAgo
  })
}

// Email template for RSVP reminders (for reference)
export const getReminderEmailTemplate = (
  guestName: string,
  inviteCode: string,
  weddingDate: string,
  coupleName: string
) => {
  const rsvpUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rsvp/${inviteCode}`
  
  return {
    subject: `Reminder: Please RSVP for ${coupleName}'s Wedding`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; text-align: center;">You're Invited!</h2>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Dear ${guestName},
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          We hope this message finds you well! We wanted to send a friendly reminder to RSVP for our wedding on ${weddingDate}.
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Your response helps us finalize important details like catering and seating arrangements. Please take a moment to let us know if you'll be able to join us.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rsvpUrl}" style="background-color: #d4a574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-size: 16px;">
            RSVP Now
          </a>
        </div>
        
        <p style="color: #4a4a4a; font-size: 14px; text-align: center;">
          Your invite code: <strong>${inviteCode}</strong>
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          We look forward to celebrating with you!
        </p>
        
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          With love,<br>
          ${coupleName}
        </p>
      </div>
    `,
    text: `
Dear ${guestName},

We hope this message finds you well! We wanted to send a friendly reminder to RSVP for our wedding on ${weddingDate}.

Your response helps us finalize important details like catering and seating arrangements. Please take a moment to let us know if you'll be able to join us.

RSVP at: ${rsvpUrl}
Your invite code: ${inviteCode}

We look forward to celebrating with you!

With love,
${coupleName}
    `
  }
}