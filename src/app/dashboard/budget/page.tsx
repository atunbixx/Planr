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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Avatar,
  Fab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { BudgetClient, type BudgetSummary } from '@/lib/api/budget.client';

type BudgetItem = {
  id: string;
  category: string;
  amount: number;
  allocated: number;
  actual: number;
  status: 'planned' | 'quoted' | 'booked' | 'paid';
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const categories = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Flowers',
  'Music/DJ',
  'Dress',
  'Decorations',
  'Transportation',
  'Other',
];

export default function BudgetPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { themeMode } = useCustomTheme();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    allocated: '',
    actual: '',
    status: 'planned',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function load() {
      try {
        const { items, summary } = await BudgetClient.list()
        const rows: BudgetItem[] = (items || []).map((it: any) => ({
          id: it.id,
          category: it.category,
          amount: Number(it.amount as any) || 0,
          allocated: Number(it.allocated as any) || 0,
          actual: Number(it.actual as any) || 0,
          status: it.status,
        }))
        setBudgetItems(rows)
        setSummary(summary)
      } catch (e) {
        console.error('Failed to load budget', e)
      }
    }
    if (!isLoading && user) load()
  }, [isLoading, user])

  const getTotalEstimated = () => summary?.totalAmount || 0;
  const getTotalActual = () => summary?.totalActual || 0;
  const getBudgetProgress = () => summary?.percentSpent || 0;

  const handleOpenDialog = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        amount: String(item.amount),
        allocated: String(item.allocated),
        actual: String(item.actual),
        status: item.status,
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: '',
        amount: '',
        allocated: '',
        actual: '',
        status: 'planned',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const payload: any = {
      category: formData.category,
      amount: Number(formData.amount || 0),
      allocated: Number(formData.allocated || 0),
      actual: Number(formData.actual || 0),
      status: formData.status,
    }
    try {
      if (editingItem) {
        await BudgetClient.update(editingItem.id, payload)
      } else {
        await BudgetClient.create(payload)
      }
      setOpenDialog(false)
      const { items, summary } = await BudgetClient.list()
      const rows: BudgetItem[] = (items || []).map((it: any) => ({
        id: it.id,
        category: it.category,
        amount: Number(it.amount as any) || 0,
        allocated: Number(it.allocated as any) || 0,
        actual: Number(it.actual as any) || 0,
        status: it.status,
      }))
      setBudgetItems(rows)
      setSummary(summary)
    } catch (e) {
      console.error('Save budget error', e)
      alert('Error saving budget item')
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BudgetClient.remove(id)
      const { items, summary } = await BudgetClient.list()
      const rows: BudgetItem[] = (items || []).map((it: any) => ({
        id: it.id,
        category: it.category,
        amount: Number(it.amount as any) || 0,
        allocated: Number(it.allocated as any) || 0,
        actual: Number(it.actual as any) || 0,
        status: it.status,
      }))
      setBudgetItems(rows)
      setSummary(summary)
    } catch (e) {
      console.error('Delete budget error', e)
      alert('Error deleting budget item')
    }
  };

  const getStatusColor = (status: BudgetItem['status']): ChipColor => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'booked':
        return 'info';
      case 'quoted':
        return 'warning';
      case 'planned':
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'quoted':
        return <WarningIcon sx={{ fontSize: 16 }} />;
      case 'booked':
        return <TrendingUpIcon sx={{ fontSize: 16 }} />;
      default:
        return <MoneyIcon sx={{ fontSize: 16 }} />;
    }
  };

  if (isLoading || !user) {
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;
    return (
      <LoadingLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </LoadingLayout>
    );
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
              Budget Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your wedding expenses and stay within budget
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">Total Amount</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>${getTotalEstimated().toLocaleString()}</Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4A5D3A' }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h6">${getTotalEstimated().toLocaleString()}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4A5D3A' }}>
                    <PieChartIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Actual
                    </Typography>
                    <Typography variant="h6">${getTotalActual().toLocaleString()}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4A5D3A' }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Budget Used
                    </Typography>
                    <LinearProgress variant="determinate" value={Math.min(getBudgetProgress(), 100)} sx={{ height: 8, borderRadius: 5 }} />
                    <Typography variant="caption" color="text.secondary">${getTotalActual().toLocaleString()} of ${getTotalEstimated().toLocaleString()}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Budget List */}
        <Card>
          <CardContent>
            {budgetItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <MoneyIcon sx={{ fontSize: 48, color: '#4A5D3A', mb: 2 }} />
                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, color: '#4A5D3A' }} gutterBottom>
                  No budget items yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start by adding your first budget item to track expenses
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add First Item
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Allocated</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Chip label={item.category} size="small" />
                        </TableCell>
                        <TableCell align="right">${item.amount.toLocaleString()}</TableCell>
                        <TableCell align="right">${item.allocated.toLocaleString()}</TableCell>
                        <TableCell align="right">${item.actual.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            size="small"
                            color={getStatusColor(item.status)}
                            icon={getStatusIcon(item.status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <TextField label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} fullWidth />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField label="Allocated" type="number" value={formData.allocated} onChange={(e) => setFormData({ ...formData, allocated: e.target.value })} fullWidth />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField label="Actual" type="number" value={formData.actual} onChange={(e) => setFormData({ ...formData, actual: e.target.value })} fullWidth />
                </Grid>
              </Grid>
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="quoted">Quoted</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Layout>
  );
}
