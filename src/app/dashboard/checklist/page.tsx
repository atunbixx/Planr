'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
-
+import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  monthsBeforeWedding: number;
}

interface ChecklistCategory {
  id: string;
  name: string;
  color: string;
  items: ChecklistItem[];
}

const defaultCategories = [
  { id: 'venue', name: 'Venue & Catering', color: '#000000' },
  { id: 'vendors', name: 'Vendors', color: '#333333' },
  { id: 'attire', name: 'Attire & Beauty', color: '#666666' },
  { id: 'legal', name: 'Legal & Documentation', color: '#999999' },
  { id: 'details', name: 'Final Details', color: '#CCCCCC' },
];

export default function ChecklistPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'venue',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: '',
    monthsBeforeWedding: '12',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const mockItems: ChecklistItem[] = [
      { id: '1', title: 'Set wedding date', description: 'Choose your perfect wedding date', category: 'venue', priority: 'high', dueDate: '2024-06-15', completed: true, completedAt: '2024-05-20', monthsBeforeWedding: 12, },
      { id: '2', title: 'Determine budget', description: 'Set overall wedding budget and allocate funds', category: 'legal', priority: 'high', completed: true, completedAt: '2024-05-25', monthsBeforeWedding: 12, },
      { id: '3', title: 'Book venue', description: 'Reserve ceremony and reception venues', category: 'venue', priority: 'high', dueDate: '2024-08-01', completed: false, monthsBeforeWedding: 12, },
      { id: '4', title: 'Book photographer', description: 'Hire wedding photographer and videographer', category: 'vendors', priority: 'high', dueDate: '2024-09-15', completed: false, monthsBeforeWedding: 9, },
      { id: '5', title: 'Choose bridal party', description: 'Ask friends and family to be in wedding party', category: 'details', priority: 'medium', completed: false, monthsBeforeWedding: 9, },
      { id: '6', title: 'Send save the dates', description: 'Mail save the date cards to guests', category: 'details', priority: 'medium', dueDate: '2024-12-15', completed: false, monthsBeforeWedding: 6, },
      { id: '7', title: 'Order wedding dress', description: 'Purchase or order wedding dress', category: 'attire', priority: 'high', dueDate: '2024-12-01', completed: false, monthsBeforeWedding: 6, },
      { id: '8', title: 'Send invitations', description: 'Mail wedding invitations to all guests', category: 'details', priority: 'high', dueDate: '2025-03-15', completed: false, monthsBeforeWedding: 3, },
      { id: '9', title: 'Book honeymoon', description: 'Plan and book honeymoon travel', category: 'details', priority: 'medium', completed: false, monthsBeforeWedding: 3, },
      { id: '10', title: 'Final venue walkthrough', description: 'Meet with venue coordinator for final details', category: 'venue', priority: 'high', dueDate: '2025-05-15', completed: false, monthsBeforeWedding: 1, },
    ];

    const organizedCategories = defaultCategories.map(cat => ({
      ...cat,
      items: mockItems.filter(item => item.category === cat.id),
    }));

    setCategories(organizedCategories);
  }, []);

  const getTotalProgress = () => {
    const allItems = categories.flatMap(cat => cat.items);
    const completedItems = allItems.filter(item => item.completed);
    return allItems.length > 0 ? (completedItems.length / allItems.length) * 100 : 0;
  };

  const handleToggleComplete = (itemId: string) => {
    setCategories(categories.map(cat => ({
      ...cat,
      items: cat.items.map(item =>
        item.id === itemId
          ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined }
          : item
      ),
    })));
  };

  const handleOpenDialog = (item?: ChecklistItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        dueDate: item.dueDate || '',
        monthsBeforeWedding: item.monthsBeforeWedding.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', category: 'venue', priority: 'medium', dueDate: '', monthsBeforeWedding: '12', });
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    // TODO: Save to API
    setOpenDialog(false);
  };

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Wedding Checklist</h1>
            <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
        </div>

        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={getTotalProgress()} />
                <p className="text-sm text-muted-foreground">{Math.round(getTotalProgress())}% of tasks completed</p>
            </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
            {defaultCategories.map(category => (
                <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger>{category.name}</AccordionTrigger>
                    <AccordionContent>
                        {categories.find(c => c.id === category.id)?.items.map(item => (
                            <div key={item.id} className="flex items-center space-x-4 p-2 border-b">
                                <Checkbox checked={item.completed} onCheckedChange={() => handleToggleComplete(item.id)} />
                                <div className="flex-1">
                                    <p className={item.completed ? 'line-through' : ''}>{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'secondary' : 'outline'}>{item.priority}</Badge>
                                <p className="text-sm text-muted-foreground">{item.dueDate}</p>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => {}}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input placeholder="Task Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value})}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            {defaultCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any})}>
                        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" placeholder="Due Date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
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
