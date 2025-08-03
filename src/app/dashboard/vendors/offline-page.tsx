'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { OfflineVendorList } from '@/components/vendors/offline-vendor-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useOfflineVendors } from '@/hooks/use-offline-data';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

// This would typically come from auth context
const USER_ID = 'current-user-id';

export default function OfflineVendorsPage() {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const { saveItem } = useOfflineVendors(USER_ID);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    price: '',
    notes: '',
    rating: '',
    is_booked: false,
  });

  const categories = [
    'Venue',
    'Catering',
    'Photography',
    'Videography',
    'Florist',
    'Music/DJ',
    'Decorations',
    'Cake',
    'Attire',
    'Transportation',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error('Please fill in required fields');
      return;
    }

    const vendorData = {
      id: editingVendor?.id || nanoid(),
      user_id: USER_ID,
      name: formData.name,
      category: formData.category,
      email: formData.email || null,
      phone: formData.phone || null,
      website: formData.website || null,
      price: formData.price ? parseFloat(formData.price) : null,
      notes: formData.notes || null,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      is_booked: formData.is_booked,
      created_at: editingVendor?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveItem(vendorData);
    
    toast.success(editingVendor ? 'Vendor updated' : 'Vendor added');
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      category: '',
      email: '',
      phone: '',
      website: '',
      price: '',
      notes: '',
      rating: '',
      is_booked: false,
    });
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      email: vendor.email || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      price: vendor.price?.toString() || '',
      notes: vendor.notes || '',
      rating: vendor.rating?.toString() || '',
      is_booked: vendor.is_booked || false,
    });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader title="Vendors (Offline Mode)" />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manage Your Wedding Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Keep track of all your wedding vendors in one place. This page works offline - 
              add, edit, and manage vendors even without an internet connection. 
              Changes will sync automatically when you're back online.
            </p>
          </CardContent>
        </Card>

        <OfflineVendorList
          userId={USER_ID}
          onAdd={() => setIsAddDialogOpen(true)}
          onEdit={handleEdit}
        />
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendor@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://vendor-website.com"
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                />
              </div>
              
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="4.5"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_booked"
                  checked={formData.is_booked}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_booked: checked })}
                />
                <Label htmlFor="is_booked">Booked</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this vendor..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}