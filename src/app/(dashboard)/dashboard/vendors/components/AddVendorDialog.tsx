'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useSupabaseAuth } from '@/lib/auth/client';
import { enterpriseApi } from '@/lib/api/enterprise-client';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface AddVendorDialogProps {
  categories: Category[];
  children?: React.ReactNode;
  onVendorAdded?: () => void;
}

interface VendorFormData {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  category: string;
  status: string;
  priority: string;
  estimatedCost: string;
  notes: string;
}

export default function AddVendorDialog({ categories, children, onVendorAdded }: AddVendorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isSignedIn } = useSupabaseAuth();

  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    category: '',
    status: 'potential',
    priority: 'medium',
    estimatedCost: '',
    notes: ''
  });

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      contactName: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      category: '',
      status: 'potential',
      priority: 'medium',
      estimatedCost: '',
      notes: ''
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      setError('You must be logged in to add vendors');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use the enterprise API client
      const vendor = await enterpriseApi.vendors.create({
        businessName: formData.businessName.trim(),
        contactName: formData.contactName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        category: formData.category || 'other',
        status: formData.status,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        notes: formData.notes.trim() || undefined,
        contractSigned: false
      });

      console.log('Vendor created successfully:', vendor);

      // Success - close dialog and reset form
      setIsOpen(false);
      resetForm();
      
      // Call callback to refresh vendor list
      onVendorAdded?.();

    } catch (error: any) {
      console.error('Error creating vendor:', error);
      setError(error.message || 'Failed to create vendor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle data-testid="add-vendor-dialog">Add New Vendor</CardTitle>
              <CardDescription>Add a wedding service provider to your list</CardDescription>
            </div>
            <Button
              data-testid="close-button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="error-message" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Business Name - Required */}
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input 
                data-testid="business-name-input"
                id="businessName" 
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                required 
                placeholder="e.g., Beautiful Blooms Florist"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input 
                  data-testid="contact-name-input"
                  id="contactName" 
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  data-testid="phone-input"
                  id="phone" 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  data-testid="email-input"
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g., info@beautifulblooms.com"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="e.g., https://beautifulblooms.com"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g., 123 Main St, City, State 12345"
              />
            </div>

            {/* Category, Status, Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">🏛️ Venue</SelectItem>
                    <SelectItem value="catering">🍽️ Catering</SelectItem>
                    <SelectItem value="photography">📸 Photography</SelectItem>
                    <SelectItem value="videography">🎥 Videography</SelectItem>
                    <SelectItem value="music">🎵 Music/DJ</SelectItem>
                    <SelectItem value="flowers">💐 Flowers</SelectItem>
                    <SelectItem value="transportation">🚗 Transportation</SelectItem>
                    <SelectItem value="cake">🎂 Wedding Cake</SelectItem>
                    <SelectItem value="beauty">💄 Hair & Makeup</SelectItem>
                    <SelectItem value="officiant">👨‍💼 Officiant</SelectItem>
                    <SelectItem value="decorations">🎀 Decorations</SelectItem>
                    <SelectItem value="other">📝 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potential">Potential</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="quote_requested">Quote Requested</SelectItem>
                    <SelectItem value="in_discussion">In Discussion</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Cost */}
            <div>
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input 
                id="estimatedCost" 
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                placeholder="e.g., 2500.00"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes about this vendor..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                data-testid="cancel-button"
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button data-testid="submit-vendor" type="submit" disabled={isLoading || !formData.businessName.trim()}>
                {isLoading ? 'Adding...' : 'Add Vendor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}