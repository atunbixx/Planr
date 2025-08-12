import React, { useState, useMemo } from 'react';
import { Search, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSeatingStore } from '@/store/seatingStore';
import { cn } from '@/lib/utils';

export const GuestList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  
  const {
    unassignedGuests,
    draggedGuestId,
    setDraggedGuest,
  } = useSeatingStore();

  // Filter and search guests
  const filteredGuests = useMemo(() => {
    let filtered = unassignedGuests;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply group filter
    if (filterGroup !== 'all') {
      filtered = filtered.filter(guest => guest.group === filterGroup);
    }
    
    return filtered;
  }, [unassignedGuests, searchTerm, filterGroup]);

  // Get unique groups
  const groups = useMemo(() => {
    const uniqueGroups = new Set(unassignedGuests.map(g => g.group).filter(Boolean));
    return Array.from(uniqueGroups);
  }, [unassignedGuests]);

  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    setDraggedGuest(guestId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const element = e.currentTarget as HTMLElement;
    element.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedGuest(null);
    
    // Remove visual feedback
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('opacity-50');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterGroup === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterGroup('all')}
            >
              All
            </Button>
            {groups.map(group => (
              <Button
                key={group}
                variant={filterGroup === group ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterGroup(group)}
              >
                {group}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Guest Count */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Unassigned Guests</span>
          <Badge variant="secondary">{filteredGuests.length}</Badge>
        </div>
      </div>

      {/* Guest List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id}
              draggable
              onDragStart={(e) => handleDragStart(e, guest.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'p-3 bg-white border rounded-lg cursor-move select-none',
                'hover:border-blue-300 hover:shadow-sm transition-all',
                draggedGuestId === guest.id && 'opacity-50'
              )}
            >
              <div className="font-medium text-sm">{guest.name}</div>
              
              <div className="flex items-center gap-2 mt-1">
                {guest.group && (
                  <Badge variant="outline" className="text-xs">
                    {guest.group}
                  </Badge>
                )}
                
                {guest.dietaryRestrictions && (
                  <Badge variant="outline" className="text-xs bg-yellow-50">
                    {guest.dietaryRestrictions}
                  </Badge>
                )}
                
                {guest.rsvp_status === 'pending' && (
                  <Badge variant="outline" className="text-xs bg-orange-50">
                    Pending RSVP
                  </Badge>
                )}
              </div>
              
              {guest.notes && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {guest.notes}
                </p>
              )}
            </div>
          ))}
          
          {filteredGuests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                {searchTerm || filterGroup !== 'all' 
                  ? 'No guests match your search'
                  : 'All guests have been assigned to tables'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};