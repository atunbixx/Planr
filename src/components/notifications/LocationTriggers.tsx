'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Power,
  Navigation,
  Building,
  Info,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSmartNotificationService } from '@/lib/services/smart-notification.service';

interface LocationTrigger {
  id: string;
  name: string;
  location_type: 'venue' | 'vendor' | 'custom';
  reference_id?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  enabled: boolean;
  trigger_data: Record<string, any>;
}

interface VenueVendor {
  id: string;
  name: string;
  type: 'venue' | 'vendor';
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function LocationTriggers() {
  const [triggers, setTriggers] = useState<LocationTrigger[]>([]);
  const [venuesVendors, setVenuesVendors] = useState<VenueVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<LocationTrigger | null>(null);
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');

  const supabase = createClientComponentClient();
  const notificationService = getSmartNotificationService();

  useEffect(() => {
    checkLocationPermission();
    loadTriggers();
    loadVenuesVendors();
  }, []);

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setLocationPermission('granted');
      toast.success('Location permission granted');
      
      // Start location tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationService.setupLocationTracking(user.id);
      }
    } catch (error) {
      setLocationPermission('denied');
      toast.error('Location permission denied');
    }
  };

  const loadTriggers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('location_triggers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error loading triggers:', error);
      toast.error('Failed to load location triggers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenuesVendors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load venues
      const { data: couples } = await supabase
        .from('wedding_couples')
        .select('venue_name, venue_address')
        .eq('user_id', user.id)
        .single();

      // Load vendors
      const { data: vendors } = await supabase
        .from('wedding_vendors')
        .select('id, business_name, address')
        .eq('couple_id', user.id);

      const items: VenueVendor[] = [];
      
      if (couples?.venue_name) {
        items.push({
          id: 'venue',
          name: couples.venue_name,
          type: 'venue',
          address: couples.venue_address
        });
      }

      if (vendors) {
        vendors.forEach(vendor => {
          items.push({
            id: vendor.id,
            name: vendor.business_name,
            type: 'vendor',
            address: vendor.address
          });
        });
      }

      setVenuesVendors(items);
    } catch (error) {
      console.error('Error loading venues/vendors:', error);
    }
  };

  const toggleTrigger = async (triggerId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('location_triggers')
        .update({ enabled })
        .eq('id', triggerId);

      if (error) throw error;

      setTriggers(prev =>
        prev.map(t => t.id === triggerId ? { ...t, enabled } : t)
      );

      toast.success(enabled ? 'Location trigger enabled' : 'Location trigger disabled');
    } catch (error) {
      console.error('Error toggling trigger:', error);
      toast.error('Failed to update trigger');
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    try {
      const { error } = await supabase
        .from('location_triggers')
        .delete()
        .eq('id', triggerId);

      if (error) throw error;

      setTriggers(prev => prev.filter(t => t.id !== triggerId));
      toast.success('Location trigger deleted');
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast.error('Failed to delete trigger');
    }
  };

  if (locationPermission === 'denied') {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Location permission is required for location-based notifications. 
              Please enable location access in your browser settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Reminders
          </span>
          {locationPermission === 'prompt' && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestLocationPermission}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Get notified when you're near important wedding locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {locationPermission === 'granted' ? (
          <>
            <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              ) : triggers.length === 0 ? (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    No location triggers set up yet. Add one to get started!
                  </AlertDescription>
                </Alert>
              ) : (
                triggers.map(trigger => (
                  <LocationTriggerItem
                    key={trigger.id}
                    trigger={trigger}
                    onToggle={(enabled) => toggleTrigger(trigger.id, enabled)}
                    onEdit={() => setEditingTrigger(trigger)}
                    onDelete={() => deleteTrigger(trigger.id)}
                  />
                ))
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => setIsAddingTrigger(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location Trigger
            </Button>
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enable location access to set up location-based reminders for your venue, 
              vendor appointments, and custom locations.
            </AlertDescription>
          </Alert>
        )}

        {/* Add/Edit Trigger Dialog */}
        <LocationTriggerDialog
          open={isAddingTrigger || !!editingTrigger}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddingTrigger(false);
              setEditingTrigger(null);
            }
          }}
          trigger={editingTrigger}
          venuesVendors={venuesVendors}
          onSave={() => {
            setIsAddingTrigger(false);
            setEditingTrigger(null);
            loadTriggers();
          }}
        />
      </CardContent>
    </Card>
  );
}

interface LocationTriggerItemProps {
  trigger: LocationTrigger;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function LocationTriggerItem({ trigger, onToggle, onEdit, onDelete }: LocationTriggerItemProps) {
  const typeIcons = {
    venue: <Building className="h-4 w-4" />,
    vendor: <Users className="h-4 w-4" />,
    custom: <MapPin className="h-4 w-4" />
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {typeIcons[trigger.location_type]}
        </div>
        <div>
          <h4 className="font-medium">{trigger.name}</h4>
          <p className="text-sm text-muted-foreground">
            Within {trigger.radius_meters}m • {trigger.location_type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={trigger.enabled}
          onCheckedChange={onToggle}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LocationTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: LocationTrigger | null;
  venuesVendors: VenueVendor[];
  onSave: () => void;
}

function LocationTriggerDialog({ 
  open, 
  onOpenChange, 
  trigger, 
  venuesVendors,
  onSave 
}: LocationTriggerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    location_type: 'venue' as 'venue' | 'vendor' | 'custom',
    reference_id: '',
    radius_meters: 100,
    custom_address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (trigger) {
      setFormData({
        name: trigger.name,
        location_type: trigger.location_type,
        reference_id: trigger.reference_id || '',
        radius_meters: trigger.radius_meters,
        custom_address: ''
      });
    } else {
      setFormData({
        name: '',
        location_type: 'venue',
        reference_id: '',
        radius_meters: 100,
        custom_address: ''
      });
    }
  }, [trigger]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let latitude = 0;
      let longitude = 0;

      // Get coordinates based on type
      if (formData.location_type === 'custom' && formData.custom_address) {
        // In a real app, you'd geocode the address
        // For now, we'll use placeholder coordinates
        latitude = 37.7749;
        longitude = -122.4194;
      } else if (formData.reference_id) {
        // Get coordinates from venue/vendor
        const selected = venuesVendors.find(v => v.id === formData.reference_id);
        if (selected?.latitude && selected?.longitude) {
          latitude = selected.latitude;
          longitude = selected.longitude;
        }
      }

      const triggerData = {
        user_id: user.id,
        name: formData.name,
        location_type: formData.location_type,
        reference_id: formData.location_type !== 'custom' ? formData.reference_id : null,
        latitude,
        longitude,
        radius_meters: formData.radius_meters,
        trigger_template_id: null, // Will be set based on type
        trigger_data: {
          venue_name: formData.name,
          vendor_name: formData.name
        },
        enabled: true
      };

      if (trigger) {
        await supabase
          .from('location_triggers')
          .update(triggerData)
          .eq('id', trigger.id);
      } else {
        await supabase
          .from('location_triggers')
          .insert(triggerData);
      }

      toast.success(trigger ? 'Location trigger updated' : 'Location trigger created');
      onSave();
    } catch (error) {
      console.error('Error saving trigger:', error);
      toast.error('Failed to save location trigger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {trigger ? 'Edit' : 'Add'} Location Trigger
          </DialogTitle>
          <DialogDescription>
            Get notified when you're near this location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Trigger Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Wedding Venue Reminder"
            />
          </div>

          <div>
            <Label htmlFor="type">Location Type</Label>
            <Select
              value={formData.location_type}
              onValueChange={(value: 'venue' | 'vendor' | 'custom') => 
                setFormData(prev => ({ ...prev, location_type: value }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue">Wedding Venue</SelectItem>
                <SelectItem value="vendor">Vendor Location</SelectItem>
                <SelectItem value="custom">Custom Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.location_type !== 'custom' ? (
            <div>
              <Label htmlFor="location">Select {formData.location_type}</Label>
              <Select
                value={formData.reference_id}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, reference_id: value }))
                }
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder={`Choose a ${formData.location_type}`} />
                </SelectTrigger>
                <SelectContent>
                  {venuesVendors
                    .filter(v => v.type === formData.location_type)
                    .map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.custom_address}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_address: e.target.value }))}
                placeholder="Enter address"
              />
            </div>
          )}

          <div>
            <Label htmlFor="radius">Trigger Radius (meters)</Label>
            <Select
              value={formData.radius_meters.toString()}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, radius_meters: parseInt(value) }))
              }
            >
              <SelectTrigger id="radius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50m (very close)</SelectItem>
                <SelectItem value="100">100m (nearby)</SelectItem>
                <SelectItem value="250">250m (walking distance)</SelectItem>
                <SelectItem value="500">500m (short drive)</SelectItem>
                <SelectItem value="1000">1km (driving distance)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name}>
            {isSubmitting ? 'Saving...' : 'Save Trigger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}