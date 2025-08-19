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
import { useAuth } from '@/hooks/useAuth';

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate?: string;
}

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
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [totalBudget, setTotalBudget] = useState(25000);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    estimatedCost: '',
    actualCost: '',
    status: 'pending',
    dueDate: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Mock data - replace with API call
    setBudgetItems([
      {
        id: '1',
        category: 'Venue',
        description: 'Garden Wedding Venue',
        estimatedCost: 5000,
        actualCost: 0,
        status: 'pending',
        dueDate: '2025-03-01',
      },
      {
        id: '2',
        category: 'Catering',
        description: 'Food and Beverages for 150 guests',
        estimatedCost: 8000,
        actualCost: 0,
        status: 'pending',
        dueDate: '2025-05-01',
      },
    ]);
  }, []);

  const getTotalEstimated = () => {
    return budgetItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  };

  const getTotalActual = () => {
    return budgetItems.reduce((sum, item) => sum + item.actualCost, 0);
  };

  const getBudgetProgress = () => {
    return (getTotalActual() / totalBudget) * 100;
  };

  const handleOpenDialog = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        description: item.description,
        estimatedCost: item.estimatedCost.toString(),
        actualCost: item.actualCost.toString(),
        status: item.status,
        dueDate: item.dueDate || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: '',
        description: '',
        estimatedCost: '',
        actualCost: '',
        status: 'pending',
        dueDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    // TODO: Save to API
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    // TODO: Delete via API
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'overdue':
        return <WarningIcon sx={{ fontSize: 16 }} />;
      default:
        return <MoneyIcon sx={{ fontSize: 16 }} />;
    }
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
              Budget Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your wedding expenses and stay on budget
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Budget Item
          </Button>
        </Box>

        {/* Budget Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'transparent', color: '#4A5D3A', border: '1px solid rgba(74, 93, 58, 0.2)', mr: 2 }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                      ${totalBudget.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getBudgetProgress()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {getBudgetProgress().toFixed(1)}% used
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'transparent', color: '#4A5D3A', border: '1px solid rgba(74, 93, 58, 0.2)', mr: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Total
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                      ${getTotalEstimated().toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {budgetItems.length} items planned
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'transparent', color: '#4A5D3A', border: '1px solid rgba(74, 93, 58, 0.2)', mr: 2 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Actual Spent
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                      ${getTotalActual().toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {budgetItems.filter(item => item.status === 'paid').length} items paid
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'transparent', color: '#4A5D3A', border: '1px solid rgba(74, 93, 58, 0.2)', mr: 2 }}>
                    <PieChartIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                      ${(totalBudget - getTotalActual()).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Available to spend
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Budget Items Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 2 }}>
              Budget Items
            </Typography>
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
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Estimated</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Chip label={item.category} size="small" />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">${item.estimatedCost.toLocaleString()}</TableCell>
                        <TableCell align="right">${item.actualCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            size="small"
                            color={getStatusColor(item.status) as any}
                            icon={getStatusIcon(item.status)}
                          />
                        </TableCell>
                        <TableCell>{item.dueDate || '-'}</TableCell>
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
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Estimated Cost"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Actual Cost"
                    type="number"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}