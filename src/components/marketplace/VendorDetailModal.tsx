import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, MapPin, Phone, Mail, Globe, Clock, Package, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { marketplaceApi } from '@/lib/api/services/marketplace'
import type { MarketplaceVendorDisplay } from '@/types/marketplace'

interface VendorDetailModalProps {
  vendor: MarketplaceVendorDisplay | null
  isOpen: boolean
  onClose: () => void
  onContact?: (vendor: MarketplaceVendorDisplay) => void
  onBook?: (vendor: MarketplaceVendorDisplay) => void
}

export function VendorDetailModal({ vendor, isOpen, onClose, onContact, onBook }: VendorDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  if (!vendor) return null

  const handleContact = () => {
    onContact?.(vendor)
  }

  const handleBook = () => {
    onBook?.(vendor)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {vendor.business_name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{vendor.category}</Badge>
            {vendor.verified && <Badge variant="secondary">Verified</Badge>}
            {vendor.featured && <Badge variant="default">Featured</Badge>}
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Header Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              {vendor.portfolio_images?.[0] && (
                <Image
                  src={vendor.portfolio_images[0]}
                  alt={vendor.business_name}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover w-full h-48"
                />
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold">{vendor.average_rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({vendor.total_reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{vendor.city}, {vendor.state}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{vendor.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>{vendor.contact_email}</span>
              </div>
              {vendor.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {vendor.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleContact} className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Vendor
            </Button>
            <Button onClick={handleBook} variant="outline" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Request Quote
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600">{vendor.long_description || vendor.description}</p>
              </div>
              
              {vendor.specialties && vendor.specialties.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {vendor.portfolio_images && vendor.portfolio_images.length > 1 && (
                <div>
                  <h3 className="font-semibold mb-2">Portfolio</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {vendor.portfolio_images.slice(1, 4).map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        width={200}
                        height={150}
                        className="rounded object-cover w-full h-32"
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              {vendor.packages && vendor.packages.length > 0 ? (
                <div className="space-y-4">
                  {vendor.packages.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{pkg.name}</h4>
                        <div className="text-right">
                          <p className="font-bold text-lg">${pkg.price}</p>
                          {pkg.is_featured && <Badge>Popular</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Includes:</p>
                        <ul className="text-gray-600 space-y-1">
                          {pkg.includes.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No packages available</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {vendor.reviews && vendor.reviews.length > 0 ? (
                <div className="space-y-4">
                  {vendor.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{review.rating}/5</span>
                      </div>
                      <p className="text-gray-600 mb-1">{review.comment}</p>
                      <p className="text-sm text-gray-500">
                        {review.couple?.name || 'Anonymous'} • {review.created_at}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </TabsContent>

            <TabsContent value="availability" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Next Available</h3>
                <p className="text-gray-600">
                  {vendor.availability?.next_available 
                    ? new Date(vendor.availability.next_available).toLocaleDateString()
                    : 'Contact for availability'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Schedule</h3>
                {vendor.availability?.schedule ? (
                  <div className="space-y-2">
                    {vendor.availability.schedule.map((slot, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{getDayName(slot.day)}</span>
                        <span className={slot.available ? 'text-green-600' : 'text-red-600'}>
                          {slot.available ? `${slot.start} - ${slot.end}` : 'Unavailable'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Schedule not available</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[day]
}