'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { DollarSign, Calculator, Plus, Edit, Trash2, TrendingUp, PieChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BudgetClient, type BudgetSummary } from '@/lib/api/budget.client';

import { cn } from '@/lib/utils';

type BudgetItem = {
  id: string;
  category: string;
  amount: number;
  allocated: number;
  actual: number;
  status: 'planned' | 'quoted' | 'booked' | 'paid';
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
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setLoading(true)
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
      } finally {
        setLoading(false)
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
    
    setSaving(true)
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimisticItem: BudgetItem = {
      id: editingItem ? editingItem.id : tempId,
      category: payload.category,
      amount: payload.amount,
      allocated: payload.allocated,
      actual: payload.actual,
      status: payload.status,
    }
    
    if (editingItem) {
      // Optimistically update existing item
      setBudgetItems(prev => prev.map(item => 
        item.id === editingItem.id ? optimisticItem : item
      ))
    } else {
      // Optimistically add new item
      setBudgetItems(prev => [...prev, optimisticItem])
    }
    
    setOpenDialog(false)
    
    try {
      if (editingItem) {
        const updated = await BudgetClient.update(editingItem.id, payload)
        setBudgetItems(prev => prev.map(item => 
          item.id === editingItem.id ? {
            id: updated.id,
            category: updated.category,
            amount: Number(updated.amount) || 0,
            allocated: Number(updated.allocated) || 0,
            actual: Number(updated.actual) || 0,
            status: updated.status,
          } : item
        ))
      } else {
        const created = await BudgetClient.create(payload)
        // Replace temp item with real item
        setBudgetItems(prev => prev.map(item => 
          item.id === tempId ? {
            id: created.id,
            category: created.category,
            amount: Number(created.amount) || 0,
            allocated: Number(created.allocated) || 0,
            actual: Number(created.actual) || 0,
            status: created.status,
          } : item
        ))
      }
      
      // Refresh summary
      const { summary } = await BudgetClient.list()
      setSummary(summary)
    } catch (e) {
      console.error('Save budget error', e)
      // Revert optimistic update on error
      if (editingItem) {
        setBudgetItems(prev => prev.map(item => 
          item.id === editingItem.id ? editingItem : item
        ))
      } else {
        setBudgetItems(prev => prev.filter(item => item.id !== tempId))
      }
      setOpenDialog(true)
    } finally {
      setSaving(false)
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return
    
    const itemToDelete = budgetItems.find(item => item.id === id)
    if (!itemToDelete) return
    
    // Optimistic delete
    setBudgetItems(prev => prev.filter(item => item.id !== id))
    
    try {
      await BudgetClient.remove(id)
      // Refresh summary
      const { summary } = await BudgetClient.list()
      setSummary(summary)
    } catch (e) {
      console.error('Delete budget error', e)
      // Revert on error
      setBudgetItems(prev => [...prev, itemToDelete])
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold">Budget Tracker</h1>
                <p className="text-muted-foreground">Track your wedding expenses and stay within budget</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
            </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${getTotalEstimated().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Estimated budget</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${getTotalActual().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Spent so far</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{getBudgetProgress().toFixed(0)}%</div>
                    <Progress value={getBudgetProgress()} className="mt-2" />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Budget Items</CardTitle>
                <CardDescription>A detailed breakdown of your budget.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="text-muted-foreground">Loading budget items...</div>
                    </div>
                ) : budgetItems.length === 0 ? (
                    <div className="text-center py-12">
                        <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Your budget is empty
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Create your wedding budget to track expenses and stay on top of your spending!
                        </p>
                        <Button onClick={() => handleOpenDialog()} className="mx-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Budget Item
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Allocated</TableHead>
                                <TableHead className="text-right">Actual</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgetItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                    <TableCell className="text-right">${item.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${item.allocated.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${item.actual.toLocaleString()}</TableCell>
                                    <TableCell><Badge variant={item.status === 'paid' ? 'default' : 'outline'}>{item.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value})}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="grid grid-cols-3 gap-4">
                        <Input placeholder="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                        <Input placeholder="Allocated" type="number" value={formData.allocated} onChange={(e) => setFormData({ ...formData, allocated: e.target.value })} />
                        <Input placeholder="Actual" type="number" value={formData.actual} onChange={(e) => setFormData({ ...formData, actual: e.target.value })} />
                    </div>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value})}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="quoted">Quoted</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}