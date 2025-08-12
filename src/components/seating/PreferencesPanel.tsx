import React, { useState } from 'react';
import { Plus, Trash2, Heart, Ban, MapPin, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSeatingStore } from '@/store/seatingStore';
import { SeatingPreferenceType } from '@prisma/client';
import { cn } from '@/lib/utils';

interface PreferenceFormData {
  type: SeatingPreferenceType;
  guestIds: string[];
}

const preferenceTypeInfo: Record<SeatingPreferenceType, { label: string; icon: React.ReactNode; color: string }> = {
  must_sit_together: { label: 'Must Sit Together', icon: <Heart className="w-4 h-4" />, color: 'text-green-600' },
  cannot_sit_together: { label: 'Cannot Sit Together', icon: <Ban className="w-4 h-4" />, color: 'text-red-600' },
  near_entrance: { label: 'Near Entrance', icon: <MapPin className="w-4 h-4" />, color: 'text-blue-600' },
  near_bar: { label: 'Near Bar', icon: <MapPin className="w-4 h-4" />, color: 'text-purple-600' },
  near_dance_floor: { label: 'Near Dance Floor', icon: <MapPin className="w-4 h-4" />, color: 'text-pink-600' },
  near_restroom: { label: 'Near Restroom', icon: <MapPin className="w-4 h-4" />, color: 'text-orange-600' },
  away_from_speakers: { label: 'Away from Speakers', icon: <MapPin className="w-4 h-4" />, color: 'text-yellow-600' },
  wheelchair_accessible: { label: 'Wheelchair Accessible', icon: <MapPin className="w-4 h-4" />, color: 'text-indigo-600' },
};

export const PreferencesPanel: React.FC = () => {
  const [isAddingPreference, setIsAddingPreference] = useState(false);
  const [formData, setFormData] = useState<PreferenceFormData>({
    type: 'must_sit_together',
    guestIds: [],
  });
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

  const {
    preferences,
    violations,
    guests,
    createPreference,
    deletePreference,
    validateSeating,
  } = useSeatingStore();

  const handleCreatePreference = async () => {
    if (selectedGuests.size === 0) return;

    await createPreference(formData.type, Array.from(selectedGuests));
    setIsAddingPreference(false);
    setSelectedGuests(new Set());
    setFormData({ type: 'must_sit_together', guestIds: [] });
    
    // Revalidate seating
    validateSeating();
  };

  const handleDeletePreference = async (preferenceId: string) => {
    if (confirm('Are you sure you want to delete this preference?')) {
      await deletePreference(preferenceId);
      validateSeating();
    }
  };

  const toggleGuestSelection = (guestId: string) => {
    const newSelection = new Set(selectedGuests);
    if (newSelection.has(guestId)) {
      newSelection.delete(guestId);
    } else {
      newSelection.add(guestId);
    }
    setSelectedGuests(newSelection);
  };

  const getViolationsForPreference = (preferenceId: string) => {
    return violations.filter(v => v.preferenceId === preferenceId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Seating Preferences</h3>
          <Button
            size="sm"
            onClick={() => setIsAddingPreference(!isAddingPreference)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Add Preference Form */}
      {isAddingPreference && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div>
            <Label htmlFor="preference-type">Preference Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: SeatingPreferenceType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="preference-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(preferenceTypeInfo).map(([value, info]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span className={info.color}>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select Guests</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-1">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className={cn(
                      'p-2 rounded cursor-pointer transition-colors',
                      selectedGuests.has(guest.id)
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : 'hover:bg-gray-100'
                    )}
                    onClick={() => toggleGuestSelection(guest.id)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{guest.name}</span>
                      {guest.group && (
                        <Badge variant="outline" className="text-xs">
                          {guest.group}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-gray-600 mt-1">
              Selected: {selectedGuests.size} guest{selectedGuests.size !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreatePreference}
              disabled={selectedGuests.size === 0}
            >
              Create Rule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingPreference(false);
                setSelectedGuests(new Set());
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Preferences List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {preferences.map((preference) => {
            const info = preferenceTypeInfo[preference.preference_type];
            const preferenceViolations = getViolationsForPreference(preference.id);
            const hasViolations = preferenceViolations.length > 0;
            
            return (
              <Card
                key={preference.id}
                className={cn(
                  'p-3',
                  hasViolations && 'border-red-500'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={info.color}>{info.icon}</span>
                      <span className="font-medium">{info.label}</span>
                      {hasViolations && (
                        <Badge variant="destructive" className="text-xs">
                          Violation
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">Guests:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preference.guests.map((guest) => (
                          <Badge key={guest.id} variant="secondary" className="text-xs">
                            {guest.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {hasViolations && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                        <div className="flex items-center gap-1 mb-1">
                          <Info className="w-3 h-3" />
                          <span className="font-medium">Violations:</span>
                        </div>
                        {preferenceViolations.map((violation, idx) => (
                          <div key={idx}>{violation.message}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePreference(preference.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
          
          {preferences.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No seating preferences yet</p>
              <p className="text-xs mt-1">Add rules to optimize guest placement</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Violations Summary */}
      {violations.length > 0 && (
        <div className="p-4 border-t bg-red-50">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <Info className="w-4 h-4" />
            <span className="font-medium">
              {violations.length} violation{violations.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => validateSeating()}
          >
            Re-validate Seating
          </Button>
        </div>
      )}
    </div>
  );
};