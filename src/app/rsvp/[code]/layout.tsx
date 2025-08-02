import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RSVP | Wedding',
  description: 'Please respond to our wedding invitation',
}

export default function RSVPLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-cream via-white to-wedding-blush">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-wedding-sage/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-wedding-gold/10 rounded-full blur-3xl" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="font-playfair text-4xl sm:text-5xl font-light text-ink mb-2">
                You're Invited
              </h1>
              <div className="w-24 h-0.5 bg-wedding-gold mx-auto mt-4" />
            </div>
            
            {/* Content Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
              {children}
            </div>
            
            {/* Footer */}
            <div className="text-center mt-8 text-sm text-gray-500">
              <p>Having trouble? Contact us at wedding@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}