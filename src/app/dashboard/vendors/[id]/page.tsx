'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Rating,
  Divider,
  Link,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Business as VendorIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
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
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { VendorsClient, type Vendor } from '@/lib/api/vendors.client';
import { VENDOR_CATEGORIES } from '@/lib/vendors/categories';
import AuthClient from '@/lib/auth/client';

function iconForCategory(id: string) {
  switch (id) {
    case 'photography': return <PhotoIcon />;
    case 'videography': return <PhotoIcon />;
    case 'venue': return <HotelIcon />;
    case 'catering': return <RestaurantIcon />;
    case 'flowers': return <FlowerIcon />;
    case 'music': return <MusicIcon />;
    case 'transportation': return <CarIcon />;
    case 'attire': return <AttireIcon />;
    case 'cake': return <CakeIcon />;
    default: return <VendorIcon />;
  }
}

const vendorCategories = [
  { id: 'all', name: 'All Vendors', icon: <VendorIcon />, color: '#000000' },
  ...VENDOR_CATEGORIES.map(c => ({ id: c.id, name: c.name, color: c.color, icon: iconForCategory(c.id) })),
];

const vendorStatuses = [
  { id: 'inquiry', name: 'Inquiry', color: '#9E9E9E' },
  { id: 'shortlisted', name: 'Shortlisted', color: '#607D8B' },
  { id: 'quoted', name: 'Quoted', color: '#FF9800' },
  { id: 'booked', name: 'Booked', color: '#4CAF50' },
  { id: 'contracted', name: 'Contracted', color: '#9C27B0' },
  { id: 'paid', name: 'Paid', color: '#009688' },
];

const priceRanges = ['$', '$$', '$$$', '$$$$'];

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { themeMode } = useCustomTheme();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [quickNotesOpen, setQuickNotesOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'photography',
    status: '',
    priceRange: '',
    contact: '',
    website: '',
    email: '',
    phone: '',
    notes: '',
    rating: '',
    isFavorite: false,
  });

  const vendorId = params?.id as string;

  useEffect(() => {
    if (!authLoading && user && vendorId) {
      fetchVendor();
    }
  }, [authLoading, user, vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const token = AuthClient.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/vendors/${vendorId}`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Vendor not found');
        } else {
          setError('Failed to load vendor');
        }
        return;
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setVendor(result.data);
        setFormData({
          name: result.data.name || '',
          category: result.data.category || 'photography',
          status: result.data.status || '',
          priceRange: result.data.priceRange || '',
          contact: result.data.contact || '',
          website: result.data.website || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          notes: result.data.notes || '',
          rating: result.data.rating ? String(result.data.rating) : '',
          isFavorite: !!result.data.isFavorite,
        });
      } else {
        setError('Failed to load vendor');
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const validStatuses = ['inquiry', 'shortlisted', 'quoted', 'booked', 'contracted', 'paid'];
      const payload = {
        ...formData,
        status: (formData.status && validStatuses.includes(formData.status)) 
          ? formData.status as 'inquiry' | 'shortlisted' | 'quoted' | 'booked' | 'contracted' | 'paid'
          : null,
        rating: formData.rating ? Number(formData.rating) : undefined,
      };
      
      const updatedVendor = await VendorsClient.updateVendor(vendorId, payload);
      setVendor(updatedVendor);
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Vendor updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error updating vendor:', error);
      setSnackbar({ open: true, message: 'Failed to update vendor', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await VendorsClient.deleteVendor(vendorId);
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: 'Vendor deleted successfully!', severity: 'success' });
      setTimeout(() => router.push('/dashboard/vendors'), 1000);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setSnackbar({ open: true, message: 'Failed to delete vendor', severity: 'error' });
    }
  };

  const handleQuickStatusUpdate = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      const validStatuses = ['inquiry', 'shortlisted', 'quoted', 'booked', 'contracted', 'paid'];
      const status = (newStatus && validStatuses.includes(newStatus)) 
        ? newStatus as 'inquiry' | 'shortlisted' | 'quoted' | 'booked' | 'contracted' | 'paid'
        : null;
      
      const updatedVendor = await VendorsClient.updateVendor(vendorId, { status });
      setVendor(updatedVendor);
      setSnackbar({ open: true, message: `Status updated to ${newStatus}!`, severity: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleQuickNoteAdd = async () => {
    if (!quickNote.trim()) return;
    
    try {
      const currentNotes = vendor?.notes || '';
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}] ${quickNote.trim()}`;
      const updatedNotes = currentNotes ? `${currentNotes}\n\n${newNote}` : newNote;
      
      const updatedVendor = await VendorsClient.updateVendor(vendorId, { notes: updatedNotes });
      setVendor(updatedVendor);
      setQuickNote('');
      setQuickNotesOpen(false);
      setSnackbar({ open: true, message: 'Note added successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error adding note:', error);
      setSnackbar({ open: true, message: 'Failed to add note', severity: 'error' });
    }
  };

  const toggleFavorite = async () => {
    try {
      const updatedVendor = await VendorsClient.updateVendor(vendorId, { 
        isFavorite: !vendor?.isFavorite 
      });
      setVendor(updatedVendor);
      setSnackbar({ 
        open: true, 
        message: updatedVendor.isFavorite ? 'Added to favorites!' : 'Removed from favorites!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
      setSnackbar({ open: true, message: 'Failed to update favorite', severity: 'error' });
    }
  };

  const getCategoryInfo = (categoryName: string) => {
    if (!categoryName) return vendorCategories[0];
    return vendorCategories.find(cat => 
      cat.id === categoryName.toLowerCase() || 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    ) || vendorCategories[0];
  };

  const getStatusInfo = (status?: string | null) => {
    if (!status) return { name: 'No Status', color: '#BDBDBD' };
    const s = vendorStatuses.find(s => s.id === status);
    return s ? { name: s.name, color: s.color } : { name: status, color: '#BDBDBD' };
  };

  if (authLoading || loading) {
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;
    return (
      <LoadingLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </LoadingLayout>
    );
  }

  if (error || !vendor) {
    const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;
    return (
      <Layout>
        <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {error || 'Vendor not found'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/vendors')}
          >
            Back to Vendors
          </Button>
        </Box>
      </Layout>
    );
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  const categoryInfo = getCategoryInfo(vendor.category);
  const statusInfo = getStatusInfo(vendor.status);

  return (
    <Layout>
      <Box sx={{ px: 3, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => router.push('/dashboard/vendors')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
              {vendor.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={vendor.category}
                size="small"
                sx={{
                  bgcolor: categoryInfo.color + '20',
                  color: categoryInfo.color,
                }}
              />
              
              {/* Inline Status Dropdown */}
              <TextField
                select
                size="small"
                value={vendor.status || ''}
                onChange={(e) => handleQuickStatusUpdate(e.target.value)}
                disabled={statusUpdating}
                sx={{ minWidth: 120 }}
                variant="outlined"
              >
                <MenuItem value="">No Status</MenuItem>
                {vendorStatuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </TextField>
              
              {vendor.priceRange && (
                <Chip label={vendor.priceRange} size="small" variant="outlined" />
              )}
              
              {/* Favorite Toggle */}
              <IconButton
                size="small"
                onClick={toggleFavorite}
                sx={{ color: vendor.isFavorite ? '#FFD700' : 'text.secondary' }}
              >
                {vendor.isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<NotesIcon />}
              onClick={() => setQuickNotesOpen(true)}
              size="small"
            >
              Add Note
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              size="small"
            >
              Edit Details
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              size="small"
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Vendor Information</Typography>
                
                {/* Contact Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Contact</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {vendor.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Link href={`tel:${vendor.phone}`} sx={{ textDecoration: 'none' }}>
                          {vendor.phone}
                        </Link>
                      </Box>
                    )}
                    {vendor.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Link href={`mailto:${vendor.email}`} sx={{ textDecoration: 'none' }}>
                          {vendor.email}
                        </Link>
                      </Box>
                    )}
                    {vendor.website && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WebsiteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Link href={vendor.website} target="_blank" rel="noopener" sx={{ textDecoration: 'none' }}>
                          Visit Website
                        </Link>
                      </Box>
                    )}
                    {vendor.contact && !vendor.phone && !vendor.email && (
                      <Typography variant="body2">{vendor.contact}</Typography>
                    )}
                  </Box>
                </Box>

                {/* Rating */}
                {(vendor as any).rating && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Rating</Typography>
                    <Rating value={(vendor as any).rating} readOnly size="small" />
                  </Box>
                )}

                {/* Notes */}
                {vendor.notes && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Notes & Interactions</Typography>
                    <Box sx={{ 
                      bgcolor: '#f8f9fa', 
                      p: 2, 
                      borderRadius: 1, 
                      border: '1px solid #e9ecef',
                      maxHeight: 200,
                      overflowY: 'auto'
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}
                      >
                        {vendor.notes}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Quote Amount */}
                {vendor.quoteAmount && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Quote Amount</Typography>
                    <Typography variant="body2">${vendor.quoteAmount.toLocaleString()}</Typography>
                  </Box>
                )}

                {/* Booked Date */}
                {vendor.bookedDate && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Booked Date</Typography>
                    <Typography variant="body2">{new Date(vendor.bookedDate).toLocaleDateString()}</Typography>
                  </Box>
                )}

                {/* Tags */}
                {vendor.tags && vendor.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {vendor.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: categoryInfo.color + '20' }}>
                        {categoryInfo.icon}
                      </Avatar>
                      <Typography variant="body2">{categoryInfo.name}</Typography>
                    </Box>
                  </Box>

                  {vendor.status && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{statusInfo.name}</Typography>
                    </Box>
                  )}

                  {vendor.priceRange && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Price Range</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{vendor.priceRange}</Typography>
                    </Box>
                  )}

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Added</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(vendor.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {vendor.isFavorite && (
                    <Box>
                      <Chip 
                        icon={<StarIcon />} 
                        label="Favorite" 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Notes Dialog */}
        <Dialog open={quickNotesOpen} onClose={() => setQuickNotesOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Quick Note</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                label="Note"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Add a note about your interaction with this vendor..."
                helperText="This will be timestamped and added to your notes"
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setQuickNotesOpen(false);
                setQuickNote('');
              }}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleQuickNoteAdd} 
              variant="contained"
              disabled={!quickNote.trim()}
              startIcon={<SaveIcon />}
            >
              Add Note
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Name"
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
              >
                {VENDOR_CATEGORIES.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="">No Status</MenuItem>
                {vendorStatuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Price Range"
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Not specified</MenuItem>
                {priceRanges.map((range) => (
                  <MenuItem key={range} value={range}>
                    {range}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />

              <TextField
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                fullWidth
              />

              <TextField
                label="Contact Info"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                fullWidth
                helperText="General contact information if phone/email not specified"
              />

              <TextField
                label="Rating"
                type="number"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                fullWidth
                inputProps={{ min: 1, max: 5, step: 0.5 }}
                helperText="Rating from 1 to 5"
              />

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Vendor</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{vendor.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}