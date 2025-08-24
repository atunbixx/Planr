'use client'

import { InviteRecord, InviteRSVPRecord } from '@/features/rsvp/repo/rsvp.repository'

interface RSVPConfirmationProps {
  rsvp: InviteRSVPRecord
  invite: InviteRecord
  onEdit: () => void
  isSubmitting: boolean
}

export function RSVPConfirmation({ rsvp, invite, onEdit, isSubmitting }: RSVPConfirmationProps) {
  const isAttending = rsvp.status === 'ATTENDING'

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Success Header */}
      <div className={`px-8 py-6 ${isAttending ? 'bg-green-50 border-b border-green-200' : 'bg-blue-50 border-b border-blue-200'}`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isAttending ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {isAttending ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div className="ml-4">
            <h2 className={`text-2xl font-bold ${isAttending ? 'text-green-800' : 'text-blue-800'}`}>
              {isAttending ? 'Thank You for Your RSVP!' : 'Thank You for Letting Us Know'}
            </h2>
            <p className={`text-sm ${isAttending ? 'text-green-700' : 'text-blue-700'}`}>
              {isAttending 
                ? "We're excited to celebrate with you!" 
                : "We understand and appreciate your response."
              }
            </p>
          </div>
        </div>
      </div>

      {/* RSVP Details */}
      <div className="px-8 py-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Response Details</h3>
        
        <div className="space-y-4">
          {/* Guest Name */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Guest Name:</span>
            <span className="text-sm text-gray-900">{invite.guestName}</span>
          </div>

          {/* Attendance Status */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Attendance:</span>
            <span className={`text-sm font-medium ${
              isAttending ? 'text-green-600' : 'text-gray-600'
            }`}>
              {isAttending ? '✓ Attending' : '✗ Not Attending'}
            </span>
          </div>

          {/* Party Size (only if attending) */}
          {isAttending && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Party Size:</span>
              <span className="text-sm text-gray-900">
                {rsvp.partySize} {rsvp.partySize === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}

          {/* Notes */}
          {rsvp.notes && (
            <div className="py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600 block mb-1">Additional Notes:</span>
              <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
                {rsvp.notes}
              </p>
            </div>
          )}

          {/* Submission Time */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Submitted:</span>
            <span className="text-sm text-gray-900">
              {new Date(rsvp.submittedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
        {isAttending ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What's Next?</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                You'll receive a confirmation email shortly with event details
              </p>
              <p className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Keep an eye out for any updates from the couple
              </p>
              <p className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                If your plans change, you can update your RSVP anytime
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">We'll Miss You!</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Thank you for letting us know in advance
              </p>
              <p className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                If your plans change, you can update your RSVP anytime
              </p>
              <p className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                We hope to celebrate with you at future events
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-8 py-6 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Need to make changes to your response?
          </div>
          
          <button
            onClick={onEdit}
            disabled={isSubmitting}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Edit Response
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">Questions?</h4>
        <p className="text-sm text-gray-700 mb-3">
          If you have any questions about the event or need to make special arrangements, 
          please don't hesitate to reach out to the couple directly.
        </p>
        
        {invite.guestEmail && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Confirmation will be sent to: {invite.guestEmail}</span>
          </div>
        )}
      </div>

      {/* Social Sharing (Optional) */}
      {isAttending && (
        <div className="px-8 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-3">
              Excited about the wedding? Share your excitement!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  const text = "I just RSVP'd to an amazing wedding! 🎉"
                  const url = window.location.href
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Share on Twitter"
              >
                Share on Twitter
              </button>
              
              <button
                onClick={() => {
                  const text = "I just RSVP'd to an amazing wedding!"
                  const url = window.location.href
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Share on Facebook"
              >
                Share on Facebook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}