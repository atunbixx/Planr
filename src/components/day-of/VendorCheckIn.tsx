import React, { useState } from 'react';
import { Clock, MapPin, Phone, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/inputs';
import { cn } from '@/lib/utils';
import { VendorCheckInStatus } from '@prisma/client';
import { formatTime, getRelativeTime } from '@/lib/utils/date';

interface VendorCheckInProps {
  vendor: {
    id: string;
    name: string;
    category: string;
    phone: string | null;
    email: string | null;
  };
  checkIn: {
    id?: string;
    vendorId: string;
    expected_arrival: Date | string;
    actual_arrival?: Date | string | null;
    setup_start?: Date | string | null;
    setup_complete?: Date | string | null;
    departure_time?: Date | string | null;
    status: VendorCheckInStatus;
    contact_person?: string | null;
    contact_phone?: string | null;
    setup_location?: string | null;
    special_instructions?: string | null;
    notes?: string | null;
  };
  onCheckIn: () => void;
  onSetupComplete: () => void;
  onUpdateNotes: (notes: string) => void;
}

export const VendorCheckIn: React.FC<VendorCheckInProps> = ({
  vendor,
  checkIn,
  onCheckIn,
  onSetupComplete,
  onUpdateNotes,
}) => {
  const [notes, setNotes] = useState(checkIn.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const getStatusColor = (status: VendorCheckInStatus) => {
    switch (status) {
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'setup_complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'departed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: VendorCheckInStatus) => {
    switch (status) {
      case 'checked_in':
      case 'setup_complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'not_arrived':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isLate = () => {
    if (checkIn.status !== 'not_arrived') return false;
    const expectedTime = new Date(checkIn.expected_arrival);
    return expectedTime < new Date();
  };

  const getTimeDifference = () => {
    if (!checkIn.actual_arrival) return null;
    
    const expected = new Date(checkIn.expected_arrival);
    const actual = new Date(checkIn.actual_arrival);
    const diffMinutes = Math.round((actual.getTime() - expected.getTime()) / 60000);
    
    if (diffMinutes === 0) return 'On time';
    if (diffMinutes > 0) return `${diffMinutes}m late`;
    return `${Math.abs(diffMinutes)}m early`;
  };

  const handleNotesSubmit = () => {
    onUpdateNotes(notes);
    setShowNotes(false);
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200',
        isLate() && 'border-red-500'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{vendor.name}</h3>
            <p className="text-sm text-gray-600">{vendor.category}</p>
          </div>
          <Badge
            className={cn(
              'flex items-center gap-1',
              getStatusColor(checkIn.status)
            )}
          >
            {getStatusIcon(checkIn.status)}
            <span className="capitalize">{checkIn.status.replace('_', ' ')}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Expected: {formatTime(checkIn.expected_arrival)}</span>
              {isLate() && (
                <span className="text-red-600 text-xs">
                  ({getRelativeTime(checkIn.expected_arrival)} late)
                </span>
              )}
            </div>
            
            {checkIn.actual_arrival && (
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Arrived: {formatTime(checkIn.actual_arrival)}</span>
                {getTimeDifference() && (
                  <span className="text-xs">({getTimeDifference()})</span>
                )}
              </div>
            )}

            {checkIn.setup_location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{checkIn.setup_location}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {(vendor.phone || checkIn.contact_phone) && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <a
                  href={`tel:${checkIn.contact_phone || vendor.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {checkIn.contact_phone || vendor.phone}
                </a>
              </div>
            )}

            {checkIn.contact_person && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{checkIn.contact_person}</span>
              </div>
            )}
          </div>
        </div>

        {checkIn.special_instructions && (
          <div className="p-2 bg-yellow-50 rounded text-sm">
            <strong>Instructions:</strong> {checkIn.special_instructions}
          </div>
        )}

        {showNotes ? (
          <div className="space-y-2">
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNotesSubmit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNotes(checkIn.notes || '');
                  setShowNotes(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          checkIn.notes && (
            <div className="p-2 bg-gray-50 rounded text-sm">
              <strong>Notes:</strong> {checkIn.notes}
            </div>
          )
        )}

        <div className="flex items-center gap-2">
          {checkIn.status === 'not_arrived' && (
            <Button
              size="sm"
              onClick={onCheckIn}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Check In
            </Button>
          )}
          
          {checkIn.status === 'checked_in' && (
            <Button
              size="sm"
              onClick={onSetupComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Setup Complete
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? 'Cancel' : checkIn.notes ? 'Edit Notes' : 'Add Notes'}
          </Button>

          {vendor.email && (
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <a href={`mailto:${vendor.email}`}>Email</a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};