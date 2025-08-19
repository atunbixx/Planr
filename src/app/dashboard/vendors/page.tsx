'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Tabs,
  Tab,
  LinearProgress,
  CircularProgress,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as VendorIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  PhotoCamera as PhotoIcon,
  Restaurant as RestaurantIcon,
  Cake as CakeIcon,
  MusicNote as MusicIcon,
  LocalFlorist as FlowerIcon,
  DirectionsCar as CarIcon,
  Hotel as HotelIcon,
  Checkroom as AttireIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import AuthClient from '@/lib/auth/client';

interface Vendor {
  id: string;
  name: string;
  category: string;
  priceRange?: string;
  contact?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

const vendorCategories = [
  { id: 'all', name: 'All Vendors', icon: <VendorIcon />, color: '#000000' },
  { id: 'photography', name: 'Photography', icon: <PhotoIcon />, color: '#333333' },
  { id: 'catering', name: 'Catering', icon: <RestaurantIcon />, color: '#666666' },
  { id: 'venue', name: 'Venue', icon: <HotelIcon />, color: '#999999' },
  { id: 'flowers', name: 'Flowers', icon: <FlowerIcon />, color: '#4CAF50' },
  { id: 'music', name: 'Music/DJ', icon: <MusicIcon />, color: '#2196F3' },
  { id: 'cake', name: 'Cake', icon: <CakeIcon />, color: '#FF9800' },
  { id: 'attire', name: 'Attire', icon: <AttireIcon />, color: '#9C27B0' },
  { id: 'transportation', name: 'Transportation', icon: <CarIcon />, color: '#795548' },
];

const priceRanges = ['$', '$$', '$$$', '$$$$'];

export default function VendorsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'photography',
    priceRange: '',
    contact: '',
    website: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  // Fetch vendors once auth is ready to ensure token is sent in headers
  useEffect(() => {
    if (!isLoading && user) {
      fetchVendors();
    }
  }, [isLoading, user]);

  useEffect(() => {
    filterVendors();
  }, [vendors, selectedCategory, searchTerm]);

  const getAuthHeaders = () => {
    const token = AuthClient.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      } else {
        if (response.status === 403) {
          const data = await response.json();
          if (data?.error?.requiresOnboarding) {
            alert('Please complete onboarding to manage vendors. Redirecting...');
            router.push('/onboarding');
            return;
          }
        }
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          router.push('/signin');
          return;
        }
        console.error('Error fetching vendors:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVendors(filtered);
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        category: vendor.category,
        priceRange: vendor.priceRange || '',
        contact: vendor.contact || '',
        website: vendor.website || '',
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        category: 'photography',
        priceRange: '',
        contact: '',
        website: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVendor(null);
  };

  const handleSave = async () => {
    try {
      const url = editingVendor 
        ? `/api/vendors/${editingVendor.id}`
        : '/api/vendors';
      
      const method = editingVendor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchVendors();
        handleCloseDialog();
      } else {
        if (response.status === 403) {
          const data = await response.json();
          if (data?.error?.requiresOnboarding) {
            alert('Please complete onboarding to add vendors. Redirecting...');
            router.push('/onboarding');
            return;
          }
        }
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          router.push('/signin');
          return;
        }
        const errorData = await response.json();
        console.error('Error saving vendor:', errorData);
        alert(errorData.error?.message || 'Error saving vendor');
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor');
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchVendors();
      } else {
        if (response.status === 403) {
          const data = await response.json();
          if (data?.error?.requiresOnboarding) {
            alert('Please complete onboarding to manage vendors. Redirecting...');
            router.push('/onboarding');
            return;
          }
        }
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          router.push('/signin');
          return;
        }
        const errorData = await response.json();
        console.error('Error deleting vendor:', errorData);
        alert(errorData.error?.message || 'Error deleting vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Error deleting vendor');
    }
  };

  const getCategoryInfo = (categoryName: string) => {
    return vendorCategories.find(cat => 
      cat.id === categoryName.toLowerCase() || 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    ) || vendorCategories[0];
  };

  const getVendorsByCategory = () => {
    const categoryCounts: { [key: string]: number } = {};
    vendors.forEach(vendor => {
      const category = vendor.category.toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    return categoryCounts;
  };

  const getProgress = () => {
    const totalCategories = vendorCategories.length - 1; // Exclude "all"
    const bookedCategories = Object.keys(getVendorsByCategory()).length;
    return totalCategories > 0 ? (bookedCategories / totalCategories) * 100 : 0;
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  const categoryCounts = getVendorsByCategory();

  return (
    <DashboardLayout>
      <Box sx={{ px: 0, py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
              Vendor Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your wedding vendors and service providers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Vendor
          </Button>
        </Box>

        {/* Progress Overview */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.625rem',
                      letterSpacing: '0.2em',
                      fontWeight: 600,
                      fontFamily: '"Bodoni Moda", serif',
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    VENDOR PROGRESS
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h2" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300, mr: 2 }}>
                      {Math.round(getProgress())}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Vendor Categories Booked
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProgress()}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#F5F5F5',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {vendorCategories.slice(1).map((category) => {
                      const count = categoryCounts[category.id] || 0;
                      return (
                        <Chip
                          key={category.id}
                          label={`${category.name} (${count})`}
                          size="small"
                          sx={{
                            bgcolor: count > 0 ? category.color + '20' : '#F5F5F5',
                            color: count > 0 ? category.color : '#999999',
                          }}
                        />
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.625rem',
                      letterSpacing: '0.2em',
                      fontWeight: 600,
                      fontFamily: '"Bodoni Moda", serif',
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    VENDOR STATS
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300 }}>
                      {vendors.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Vendors
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 1 }}>
                      Top Categories
                    </Typography>
                    {Object.entries(categoryCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([category, count]) => {
                        const categoryInfo = getCategoryInfo(category);
                        return (
                          <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{categoryInfo.name}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{count}</Typography>
                          </Box>
                        );
                      })}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, px: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#999999' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {vendorCategories.map((category) => (
                  <Tab
                    key={category.id}
                    value={category.id}
                    label={category.name}
                    icon={category.icon}
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                ))}
              </Tabs>
            </Grid>
          </Grid>
        </Box>

        {/* Vendors Grid */}
        <Box sx={{ px: 3 }}>
          {filteredVendors.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <VendorIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
                <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, color: '#999999' }} gutterBottom>
                  {vendors.length === 0 ? 'No vendors yet' : 'No vendors found'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {vendors.length === 0 
                    ? 'Start building your dream team by adding your first vendor'
                    : 'Try adjusting your search or filter criteria'
                  }
                </Typography>
                {vendors.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add First Vendor
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredVendors.map((vendor) => {
                const categoryInfo = getCategoryInfo(vendor.category);
                return (
                  <Grid item xs={12} sm={6} md={4} key={vendor.id}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: categoryInfo.color,
                              color: '#FFFFFF',
                              width: 48,
                              height: 48,
                              mr: 2,
                            }}
                          >
                            {categoryInfo.icon}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontFamily: '"Bodoni Moda", serif',
                                fontWeight: 400,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {vendor.name}
                            </Typography>
                            <Chip
                              label={vendor.category}
                              size="small"
                              sx={{
                                bgcolor: categoryInfo.color + '20',
                                color: categoryInfo.color,
                                fontSize: '0.625rem',
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ flex: 1, mb: 2 }}>
                          {vendor.priceRange && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <MoneyIcon sx={{ fontSize: 16, color: '#999999', mr: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                {vendor.priceRange}
                              </Typography>
                            </Box>
                          )}
                          {vendor.contact && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PhoneIcon sx={{ fontSize: 16, color: '#999999', mr: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                {vendor.contact}
                              </Typography>
                            </Box>
                          )}
                          {vendor.website && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <WebsiteIcon sx={{ fontSize: 16, color: '#999999', mr: 1 }} />
                              <Link
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                sx={{ textDecoration: 'none' }}
                              >
                                Visit Website
                              </Link>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Added {new Date(vendor.createdAt).toLocaleDateString()}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(vendor)}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(vendor.id)}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                SelectProps={{ native: true }}
                required
              >
                {vendorCategories.slice(1).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Price Range"
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="">Select price range</option>
                {priceRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Contact Information"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                fullWidth
                placeholder="Phone, email, or other contact info"
              />
              <TextField
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                fullWidth
                placeholder="https://vendorwebsite.com"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingVendor ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}