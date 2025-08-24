import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RSVPService } from '@/features/rsvp/service/rsvp.service'
import { RSVPPageClient } from './RSVPPageClient'

interface RSVPPageProps {
  params: {
    inviteId: string
  }
}

/**
 * Generate metadata for RSVP page
 */
export async function generateMetadata({ params }: RSVPPageProps): Promise<Metadata> {
  try {
    const rsvpService = new RSVPService()
    const result = await rsvpService.validateInvite(params.inviteId)

    if (!result.success || !result.data?.valid || !result.data.invite) {
      return {
        title: 'RSVP - Invalid Invite | Planr',
        description: 'The RSVP invite you are looking for is invalid or has expired.',
        robots: { index: false, follow: false }
      }
    }

    const invite = result.data.invite
    
    return {
      title: `RSVP - Wedding Invitation | Planr`,
      description: `Please respond to this wedding invitation. Your response is important to us.`,
      robots: { index: false, follow: false }, // Private pages shouldn't be indexed
      openGraph: {
        title: 'Wedding RSVP',
        description: 'Please respond to this wedding invitation',
        type: 'website',
        siteName: 'Planr'
      }
    }
  } catch (error) {
    console.error('Error generating RSVP metadata:', error)
    return {
      title: 'RSVP | Planr',
      description: 'Wedding RSVP Response',
      robots: { index: false, follow: false }
    }
  }
}

/**
 * RSVP page component with server-side invite validation
 */
export default async function RSVPPage({ params }: RSVPPageProps) {
  try {
    // Validate invite ID format
    if (!params.inviteId || params.inviteId.length < 10) {
      notFound()
    }

    // Validate invite on server-side
    const rsvpService = new RSVPService()
    const inviteResult = await rsvpService.validateInvite(params.inviteId)

    if (!inviteResult.success) {
      console.error('Failed to validate invite:', inviteResult.error)
      notFound()
    }

    if (!inviteResult.data?.valid || !inviteResult.data.invite) {
      notFound()
    }

    const invite = inviteResult.data.invite

    // Check for existing RSVP
    const existingRSVPResult = await rsvpService.getRSVPByInviteId(invite.id)
    const existingRSVP = existingRSVPResult.success ? existingRSVPResult.data : null

    // Server-rendered content for SEO and noscript
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Noscript fallback */}
        <noscript>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Wedding RSVP
                </h1>
                <p className="text-lg text-gray-600">
                  Dear {invite.guestName || 'Guest'},
                </p>
                <p className="text-gray-600 mt-2">
                  You have been invited to a special wedding celebration.
                </p>
              </div>

              {existingRSVP ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-green-800 mb-4">
                    Thank You for Your Response!
                  </h2>
                  <div className="space-y-2 text-green-700">
                    <p><strong>Status:</strong> {existingRSVP.status}</p>
                    <p><strong>Party Size:</strong> {existingRSVP.partySize}</p>
                    {existingRSVP.notes && (
                      <p><strong>Notes:</strong> {existingRSVP.notes}</p>
                    )}
                    <p><strong>Submitted:</strong> {new Date(existingRSVP.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4">
                      Invitation Details
                    </h2>
                    <div className="space-y-2 text-blue-700">
                      <p><strong>Guest:</strong> {invite.guestName}</p>
                      {invite.guestEmail && (
                        <p><strong>Email:</strong> {invite.guestEmail}</p>
                      )}
                      <p><strong>Maximum Party Size:</strong> {invite.maxPartySize}</p>
                      <p><strong>Invited:</strong> {new Date(invite.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      JavaScript Required
                    </h3>
                    <p className="text-yellow-700">
                      This RSVP form requires JavaScript to function properly. 
                      Please enable JavaScript in your browser to respond to this invitation.
                    </p>
                    <p className="text-yellow-700 mt-2">
                      Alternatively, you can contact the couple directly using the information provided in your invitation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </noscript>

        {/* Client-side component */}
        <RSVPPageClient 
          invite={invite} 
          existingRSVP={existingRSVP}
          inviteToken={params.inviteId}
        />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: 'Wedding RSVP',
              description: 'Wedding invitation RSVP response',
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              organizer: {
                '@type': 'Organization',
                name: 'Planr'
              }
            })
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in RSVP page:', error)
    notFound()
  }
}