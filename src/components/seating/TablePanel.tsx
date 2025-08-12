import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Circle, Square, Hexagon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/inputs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSeatingStore } from '@/store/seatingStore';
import { TableShape as TableShapeType } from '@prisma/client';
import { cn } from '@/lib/utils';

interface TableFormData {
  table_number: string;
  table_name?: string;
  capacity: number;
  shape: TableShapeType;
}

export const TablePanel: React.FC = () => {
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    table_number: '',
    table_name: '',
    capacity: 8,
    shape: 'round',
  });

  const {
    tables,
    selectedTableId,
    createTable,
    updateTable,
    deleteTable,
    selectTable,
    getTableGuestCount,
    currentLayout,
  } = useSeatingStore();

  const handleCreateTable = async () => {
    if (!formData.table_number || !currentLayout) return;

    await createTable({
      layout_id: currentLayout.id,
      table_number: formData.table_number,
      table_name: formData.table_name || undefined,
      capacity: formData.capacity,
      shape: formData.shape,
      x_position: Math.random() * 500 + 100, // Random position
      y_position: Math.random() * 400 + 100,
      rotation: 0,
      width: formData.shape === 'rectangular' ? 120 : undefined,
      height: formData.shape === 'rectangular' ? 80 : undefined,
    });

    setIsAddingTable(false);
    resetForm();
  };

  const handleUpdateTable = async () => {
    if (!editingTableId || !formData.table_number) return;

    await updateTable(editingTableId, {
      table_number: formData.table_number,
      table_name: formData.table_name || undefined,
      capacity: formData.capacity,
      shape: formData.shape,
    });

    setEditingTableId(null);
    resetForm();
  };

  const handleDeleteTable = async (tableId: string) => {
    if (confirm('Are you sure you want to delete this table? All guest assignments will be removed.')) {
      await deleteTable(tableId);
      if (selectedTableId === tableId) {
        selectTable(null);
      }
    }
  };

  const startEdit = (table: any) => {
    setEditingTableId(table.id);
    setFormData({
      table_number: table.table_number,
      table_name: table.table_name || '',
      capacity: table.capacity,
      shape: table.shape,
    });
  };

  const resetForm = () => {
    setFormData({
      table_number: '',
      table_name: '',
      capacity: 8,
      shape: 'round',
    });
  };

  const getShapeIcon = (shape: TableShapeType) => {
    switch (shape) {
      case 'round':
        return <Circle className="w-4 h-4" />;
      case 'square':
      case 'rectangular':
        return <Square className="w-4 h-4" />;
      default:
        return <Hexagon className="w-4 h-4" />;
    }
  };

  const getTableStatus = (table: any) => {
    const guestCount = getTableGuestCount(table.id);
    const percentage = (guestCount / table.capacity) * 100;
    
    if (percentage === 100) return 'full';
    if (percentage >= 75) return 'nearly-full';
    if (percentage > 0) return 'partial';
    return 'empty';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'nearly-full':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tables</h3>
          <Button
            size="sm"
            onClick={() => setIsAddingTable(!isAddingTable)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingTable || editingTableId) && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="table-number">Table Number</Label>
              <Input
                id="table-number"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                placeholder="e.g., 1 or A"
              />
            </div>
            <div>
              <Label htmlFor="table-name">Name (Optional)</Label>
              <Input
                id="table-name"
                value={formData.table_name}
                onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                placeholder="e.g., Family"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 8 })}
              />
            </div>
            <div>
              <Label htmlFor="shape">Shape</Label>
              <Select
                value={formData.shape}
                onValueChange={(value: TableShapeType) => setFormData({ ...formData, shape: value })}
              >
                <SelectTrigger id="shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={editingTableId ? handleUpdateTable : handleCreateTable}
            >
              {editingTableId ? 'Update' : 'Create'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingTable(false);
                setEditingTableId(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {tables.map((table) => {
            const guestCount = getTableGuestCount(table.id);
            const status = getTableStatus(table);
            const isSelected = selectedTableId === table.id;
            
            return (
              <Card
                key={table.id}
                className={cn(
                  'p-3 cursor-pointer transition-all',
                  isSelected && 'ring-2 ring-blue-500',
                  'hover:shadow-md'
                )}
                onClick={() => selectTable(table.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getShapeIcon(table.shape)}
                      <span className="font-semibold">Table {table.table_number}</span>
                      {table.table_name && (
                        <span className="text-sm text-gray-500">• {table.table_name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn('text-xs', getStatusColor(status))}>
                        {guestCount}/{table.capacity} seats
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(table);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {table.assignments && table.assignments.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1">Guests:</div>
                    <div className="flex flex-wrap gap-1">
                      {table.assignments.slice(0, 3).map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="text-xs">
                          {assignment.guest.name}
                        </Badge>
                      ))}
                      {table.assignments.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{table.assignments.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          
          {tables.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No tables yet</p>
              <p className="text-xs mt-1">Click "Add Table" to create one</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tables:</span>
            <span className="font-medium">{tables.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Capacity:</span>
            <span className="font-medium">
              {tables.reduce((sum, t) => sum + t.capacity, 0)} seats
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};