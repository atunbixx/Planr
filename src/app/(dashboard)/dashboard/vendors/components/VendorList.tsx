'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Globe, 
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Calendar
} from 'lucide-react';
import ContractDialog from './ContractDialog';
import PaymentScheduleDialog from '../../budget/components/PaymentScheduleDialog';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: string;
  priority: string;
  rating?: number;
  estimatedCost?: number;
  vendorCategories?: {
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
  const [contracts, setContracts] = useState<any[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([]);

  const handleContractSave = async (contract: any) => {
    try {
      // Add to local state
      setContracts(prev => {
        const existing = prev.findIndex(c => c.id === contract.id);
        if (existing >= 0) {
          return prev.map(c => c.id === contract.id ? contract : c);
        }
        return [...prev, contract];
      });
      
      toast.success('Contract saved successfully!');
    } catch (error) {
      console.error('Error handling contract save:', error);
      toast.error('Failed to save contract');
    }
  };

  const handlePaymentScheduleSave = async (schedule: any) => {
    try {
      setPaymentSchedules(prev => {
        const existing = prev.findIndex(s => s.id === schedule.id);
        if (existing >= 0) {
          return prev.map(s => s.id === schedule.id ? schedule : s);
        }
        return [...prev, schedule];
      });
      
      toast.success('Payment schedule saved successfully!');
    } catch (error) {
      console.error('Error handling payment schedule save:', error);
      toast.error('Failed to save payment schedule');
    }
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="hover:shadow-md transition-shadow h-fit">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with icon, name and actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{vendor.vendorCategories?.icon || '🏢'}</span>
                  <div>
                    <h3 className="text-lg font-light tracking-wide text-gray-900 uppercase">{vendor.name}</h3>
                    {vendor.contactName && (
                      <p className="text-sm font-light text-gray-600">Contact: {vendor.contactName}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <ContractDialog 
                    vendor={{
                      id: vendor.id,
                      name: vendor.name,
                      contactName: vendor.contactName,
                      estimatedCost: vendor.estimatedCost
                    }}
                    onSave={handleContractSave}
                  >
                    <Button variant="outline" size="sm" title="Manage Contract">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </ContractDialog>
                  <PaymentScheduleDialog
                    vendor={{
                      id: vendor.id,
                      name: vendor.name,
                      estimatedCost: vendor.estimatedCost
                    }}
                    onSave={handlePaymentScheduleSave}
                  >
                    <Button variant="outline" size="sm" title="Payment Schedule">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PaymentScheduleDialog>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
                
              {/* Status and category badges */}
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(vendor.status)}
                {vendor.vendorCategories && (
                  <Badge variant="outline">
                    {vendor.vendorCategories.name}
                  </Badge>
                )}
                {vendor.estimatedCost && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ${vendor.estimatedCost.toLocaleString()}
                  </Badge>
                )}
              </div>

              {/* Contact information */}
               <div className="space-y-2 text-sm font-light">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
