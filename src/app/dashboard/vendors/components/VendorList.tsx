'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Globe, 
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: string;
  priority: string;
  rating?: number;
  estimated_cost?: number;
  vendor_categories?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface VendorListProps {
  vendors: Vendor[];
  categories: Category[];
}

export default function VendorList({ vendors, categories }: VendorListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Booked</Badge>
      case 'in_discussion':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Discussion</Badge>
      case 'quote_requested':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Quote Requested</Badge>
      case 'contacted':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Contacted</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Declined</Badge>
      default:
        return <Badge variant="outline">Potential</Badge>
    }
  };

  return (
    <div className="space-y-4">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{vendor.vendor_categories?.icon || '🏢'}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                    {vendor.contact_name && (
                      <p className="text-sm text-muted-foreground">Contact: {vendor.contact_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {getStatusBadge(vendor.status)}
                  {vendor.vendor_categories && (
                    <Badge variant="outline">
                      {vendor.vendor_categories.name}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Visit Site <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
