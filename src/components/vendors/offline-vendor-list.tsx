'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Edit, 
  Trash2,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useOfflineVendors } from '@/hooks/use-offline-data';
import { OfflineIndicator } from '@/components/offline/offline-indicator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OfflineVendorListProps {
  userId: string;
  onEdit?: (vendor: any) => void;
  onAdd?: () => void;
}

export function OfflineVendorList({ userId, onEdit, onAdd }: OfflineVendorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const {
    data: vendors,
    loading,
    isOnline,
    syncStatus,
    deleteItem,
    sync,
  } = useOfflineVendors(userId);

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

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteItem(id);
      toast.success(`${name} deleted`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Status */}
      {(!isOnline || syncStatus.pending > 0) && (
        <Card className={cn(
          'border-2',
          !isOnline ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10' : 'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
        )}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <>
                  <WifiOff className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      You're offline
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">
                      Changes will sync when you're back online
                    </p>
                  </div>
                </>
              ) : syncStatus.pending > 0 && (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {syncStatus.pending} changes pending
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Syncing automatically...
                    </p>
                  </div>
                </>
              )}
            </div>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={sync}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory
                ? 'No vendors found matching your filters'
                : 'No vendors added yet'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={onAdd}
            >
              Add Your First Vendor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className={cn(
                'relative overflow-hidden transition-all hover:shadow-lg',
                vendor.sync_status === 'pending' && 'ring-2 ring-blue-200'
              )}
            >
              {vendor.sync_status === 'pending' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {vendor.category}
                    </Badge>
                  </div>
                  {vendor.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{vendor.rating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {vendor.price && (
                  <p className="text-2xl font-bold text-purple-600">
                    ${vendor.price.toLocaleString()}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">{vendor.website}</span>
                    </div>
                  )}
                </div>
                
                {vendor.is_booked && (
                  <Badge className="w-full justify-center" variant="default">
                    Booked
                  </Badge>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit?.(vendor)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(vendor.id, vendor.name)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-center">
        <OfflineIndicator showWhenOnline={true} />
      </div>
    </div>
  );
}