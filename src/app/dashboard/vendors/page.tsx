'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Store, Phone, Globe, DollarSign, Search, Star, Camera, Utensils, Cake, Music, Flower, Car, Hotel, Shirt } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VENDOR_CATEGORIES } from '@/lib/vendors/categories'
import { useAuth } from '@/hooks/useAuth'
import { VendorsClient } from '@/lib/api/vendors.client'

interface Vendor {
  id: string;
  name: string;
  category: string;
  status?: 'inquiry' | 'shortlisted' | 'quoted' | 'booked' | 'contracted' | 'paid' | null;
  priceRange?: string;
  contact?: string;
  website?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

type DirVendor = {
  id: string
  name: string
  category: string
  city?: string
  region?: string
  priceBand?: string
  averageRating?: number
  reviewCount?: number
  shortDescription?: string
  photos?: string[]
  website?: string
  phone?: string
}

export default function VendorsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [formData, setFormData] = useState({
    name: '',
    category: 'photography',
    status: '',
    priceRange: '',
    contact: '',
    website: '',
    email: '',
    phone: '',
    quoteAmount: '',
    notes: '',
    rating: '',
    tags: '',
    isFavorite: false,
  });
  const [formErrors, setFormErrors] = useState<{ quoteAmount?: string; rating?: string }>({});

  // Marketplace state
  const [marketplaceVendors, setMarketplaceVendors] = useState<DirVendor[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [marketplacePageSize] = useState(12);
  const [marketplaceQuery, setMarketplaceQuery] = useState('');
  const [marketplaceCategory, setMarketplaceCategory] = useState('');
  const [marketplaceRegion, setMarketplaceRegion] = useState('');
  const [marketplaceMinRating, setMarketplaceMinRating] = useState('');
  const [marketplaceSort, setMarketplaceSort] = useState('newest');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  const fetchVendors = useCallback(async () => {
    try {
      const { vendors, total } = await VendorsClient.listVendors({
        category: selectedCategory,
        status: selectedStatus,
        q: searchTerm,
        page: currentPage,
        pageSize,
      })
      setVendors(vendors)
      setFilteredVendors(vendors)
      if (typeof total === 'number') setTotal(total)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedStatus, searchTerm, currentPage, pageSize]);

    const fetchMarketplaceVendors = useCallback(async () => {
        setMarketplaceLoading(true);
        try {
            const res = await fetch(`/api/public/vendors?q=${marketplaceQuery}&category=${marketplaceCategory}&region=${marketplaceRegion}&minRating=${marketplaceMinRating}&sort=${marketplaceSort}&page=${marketplacePage}&pageSize=${marketplacePageSize}`);
            const data = await res.json();
            setMarketplaceVendors(data.data.vendors);
            setMarketplaceTotal(data.data.total);
        } catch (error) {
            console.error('Error fetching marketplace vendors:', error);
        } finally {
            setMarketplaceLoading(false);
        }
    }, [marketplaceQuery, marketplaceCategory, marketplaceRegion, marketplaceMinRating, marketplaceSort, marketplacePage, marketplacePageSize]);

  useEffect(() => {
    if (!isLoading && user) {
      fetchVendors();
      fetchMarketplaceVendors();
    }
  }, [isLoading, user, fetchVendors, fetchMarketplaceVendors]);

  const handleSave = async () => {
    const payload = {
        ...formData,
        status: formData.status || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        quoteAmount: formData.quoteAmount ? Number(formData.quoteAmount) : undefined,
        notes: formData.notes || undefined,
        rating: formData.rating ? Number(formData.rating) : undefined,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : undefined,
      };
    try {
      if (editingVendor) {
        await VendorsClient.updateVendor(editingVendor.id, payload)
      } else {
        await VendorsClient.createVendor(payload)
      }
      await fetchVendors()
      setOpenDialog(false)
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await VendorsClient.deleteVendor(vendorId)
      await fetchVendors()
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const handleSaveMarketplaceVendor = async (vendor: DirVendor) => {
    setSaving(prev => ({...prev, [vendor.id]: true}));
    try {
        await VendorsClient.createVendor({
            name: vendor.name,
            category: vendor.category,
            website: vendor.website,
            phone: vendor.phone,
            contact: vendor.phone || vendor.website || '',
            priceRange: vendor.priceBand,
            notes: vendor.shortDescription || '',
            status: 'inquiry',
        });
        setSaved(prev => ({...prev, [vendor.id]: true}));
        fetchVendors();
    } catch (error) {
        console.error('Error saving marketplace vendor:', error);
    } finally {
        setSaving(prev => ({...prev, [vendor.id]: false}));
    }
  }

  const openAdd = () => {
    setEditingVendor(null);
    setFormData({
        name: '',
        category: 'photography',
        status: '',
        priceRange: '',
        contact: '',
        website: '',
        email: '',
        phone: '',
        quoteAmount: '',
        notes: '',
        rating: '',
        tags: '',
        isFavorite: false,
      });
    setOpenDialog(true);
  }

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
        ...vendor,
        status: vendor.status || '',
        priceRange: vendor.priceRange || '',
        contact: vendor.contact || '',
        website: vendor.website || '',
        email: (vendor as any).email || '',
        phone: (vendor as any).phone || '',
        quoteAmount: (vendor as any).quoteAmount ? String((vendor as any).quoteAmount) : '',
        notes: (vendor as any).notes || '',
        rating: (vendor as any).rating ? String((vendor as any).rating) : '',
        tags: Array.isArray((vendor as any).tags) ? ((vendor as any).tags as string[]).join(', ') : '',
    });
    setOpenDialog(true);
  }

  if (isLoading || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Vendor Directory</h1>
            <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Vendor</Button>
        </div>
        <Tabs defaultValue="my-vendors">
            <TabsList>
                <TabsTrigger value="my-vendors">My Vendors</TabsTrigger>
                <TabsTrigger value="marketplace">Browse Marketplace</TabsTrigger>
            </TabsList>
            <TabsContent value="my-vendors">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vendors.map(vendor => (
                        <Card key={vendor.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{vendor.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(vendor)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </CardTitle>
                                <CardDescription>{vendor.category}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{vendor.contact}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Globe className="h-4 w-4" />
                                    <a href={vendor.website} target="_blank" rel="noreferrer">{vendor.website}</a>
                                </div>
                                <Badge>{vendor.status}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="marketplace">
                <div className="flex items-center space-x-2 mb-4">
                    <Input
                        placeholder="Search marketplace..."
                        value={marketplaceQuery}
                        onChange={(e) => setMarketplaceQuery(e.target.value)}
                        className="max-w-sm"
                    />
                    <Select value={marketplaceCategory} onValueChange={setMarketplaceCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Categories</SelectItem>
                            {VENDOR_CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={marketplaceRegion} onValueChange={setMarketplaceRegion}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Regions</SelectItem>
                            <SelectItem value="NG">Nigeria</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={marketplaceMinRating} onValueChange={setMarketplaceMinRating}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Min Rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Any Rating</SelectItem>
                            <SelectItem value="5">5 stars</SelectItem>
                            <SelectItem value="4">4+ stars</SelectItem>
                            <SelectItem value="3">3+ stars</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={marketplaceSort} onValueChange={setMarketplaceSort}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="rating_desc">Rating</SelectItem>
                            <SelectItem value="reviews_desc">Most Reviews</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {marketplaceVendors.map(vendor => (
                        <Card key={vendor.id}>
                            <CardHeader>
                                {vendor.photos && vendor.photos.length > 0 && <img src={vendor.photos[0]} alt={vendor.name} className="w-full h-32 object-cover" />}
                                <CardTitle>{vendor.name}</CardTitle>
                                <CardDescription>{vendor.category}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>{vendor.city}, {vendor.region}</p>
                                <p>{vendor.priceBand}</p>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={i < (vendor.averageRating || 0) ? "text-yellow-500" : "text-gray-300"} />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-500">({vendor.reviewCount} reviews)</span>
                                </div>
                                <Button onClick={() => handleSaveMarketplaceVendor(vendor)} disabled={saving[vendor.id] || saved[vendor.id]} className="mt-4 w-full">
                                    {saved[vendor.id] ? 'Added' : saving[vendor.id] ? 'Adding...' : 'Add to My Vendors'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={() => setMarketplacePage(p => p - 1)} disabled={marketplacePage === 1}>Previous</Button>
                    <span className="mx-4">Page {marketplacePage}</span>
                    <Button variant="outline" onClick={() => setMarketplacePage(p => p + 1)} disabled={marketplaceVendors.length < marketplacePageSize}>Next</Button>
                </div>
            </TabsContent>
        </Tabs>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Vendor Name" />
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            {VENDOR_CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input name="contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} placeholder="Contact" />
                    <Input name="website" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} placeholder="Website" />
                    <Input name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" />
                    <Input name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
                    <Input name="quoteAmount" value={formData.quoteAmount} onChange={(e) => setFormData({...formData, quoteAmount: e.target.value})} placeholder="Quote Amount" />
                    <Input name="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Notes" />
                    <Input name="rating" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} placeholder="Rating" />
                    <Input name="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="Tags (comma separated)" />
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isFavorite" checked={formData.isFavorite} onCheckedChange={(checked) => setFormData({...formData, isFavorite: !!checked})} />
                        <label htmlFor="isFavorite">Favorite</label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}

const handleCreateVendor = async () => {
  if (!newVendor.name || !newVendor.category) {
    alert('Please enter a name and category for the vendor.');
    return;
  }
  try {
    const vendor = await createVendor(newVendor as any);
    setVendors([...vendors, vendor]);
    setNewVendor({ name: '', category: '', status: 'inquiry', priceRange: '', contact: '', website: '', email: '', phone: '', quoteAmount: '', notes: '', rating: '', tags: '', isFavorite: false });
    setOpen(false);
  } catch (error) {
    console.error('Error creating vendor:', error);
  }
};

const handleUpdateVendor = async (vendorId: string, updatedVendor: Partial<Vendor>) => {
  try {
    const vendor = await updateVendor(vendorId, updatedVendor as any);
    setVendors(vendors.map(v => v.id === vendorId ? vendor : v));
  } catch (error) {
    console.error('Error updating vendor:', error);
  }
};

          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
            <DialogDescription>
              {editingVendor ? 'Update the details of your vendor.' : 'Add a new vendor to your list.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Vendor Name"
              value={editingVendor ? editingVendor.name : newVendor.name}
              onChange={(e) => editingVendor ? setEditingVendor({ ...editingVendor, name: e.target.value }) : setNewVendor({ ...newVendor, name: e.target.value })}
            />
            <Input
              placeholder="Category (e.g., Catering, Photography)"
              value={editingVendor ? editingVendor.category : newVendor.category}
              onChange={(e) => editingVendor ? setEditingVendor({ ...editingVendor, category: e.target.value }) : setNewVendor({ ...newVendor, category: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={editingVendor ? () => { handleUpdateVendor(editingVendor.id, editingVendor); setEditingVendor(null); setOpen(false); } : handleCreateVendor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {vendor.name}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingVendor(vendor); setOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{vendor.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{vendor.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{vendor.website || 'N/A'}</a>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Status: {vendor.status}</p>
                <p className="text-sm font-medium text-gray-700">Quote: ${vendor.quoteAmount || 'N/A'}</p>
              </div>
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  i < (vendor.rating || 0) ? <Star key={i} className="h-5 w-5 text-yellow-400" /> : <Star key={i} className="h-5 w-5 text-gray-300" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default VendorsPage;