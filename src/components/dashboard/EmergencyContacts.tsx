'use client';

import { useState } from 'react';
import { Phone, Mail, MessageSquare, AlertTriangle, Plus, Edit2, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  category: 'vendor' | 'venue' | 'medical' | 'coordinator' | 'family' | 'other';
  phone: string;
  alternatePhone?: string;
  email?: string;
  notes?: string;
  isPrimary?: boolean;
}

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  onUpdate?: (contacts: EmergencyContact[]) => void;
  isFloating?: boolean;
}

const CATEGORY_CONFIG = {
  vendor: { color: 'bg-purple-100 text-purple-800', icon: '🛍️' },
  venue: { color: 'bg-blue-100 text-blue-800', icon: '🏛️' },
  medical: { color: 'bg-red-100 text-red-800', icon: '🏥' },
  coordinator: { color: 'bg-green-100 text-green-800', icon: '👥' },
  family: { color: 'bg-yellow-100 text-yellow-800', icon: '👨‍👩‍👧' },
  other: { color: 'bg-gray-100 text-gray-800', icon: '📞' },
};

export default function EmergencyContacts({
  contacts: initialContacts,
  onUpdate,
  isFloating = false,
}: EmergencyContactsProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contacts by category
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.category]) {
      acc[contact.category] = [];
    }
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, EmergencyContact[]>);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleSMS = (phone: string) => {
    window.location.href = `sms:${phone}`;
  };

  const handleSaveContact = (contact: EmergencyContact) => {
    let updatedContacts;
    
    if (editingContact) {
      updatedContacts = contacts.map(c => c.id === contact.id ? contact : c);
    } else {
      updatedContacts = [...contacts, { ...contact, id: Date.now().toString() }];
    }
    
    setContacts(updatedContacts);
    if (onUpdate) {
      onUpdate(updatedContacts);
    }
    
    setIsEditing(false);
    setEditingContact(null);
    toast.success(editingContact ? 'Contact updated' : 'Contact added');
  };

  const handleDeleteContact = (id: string) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    if (onUpdate) {
      onUpdate(updatedContacts);
    }
    toast.success('Contact removed');
  };

  if (isFloating) {
    return (
      <>
        {/* Floating Action Button */}
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className={cn(
            'fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg',
            'bg-red-600 hover:bg-red-700'
          )}
        >
          <Phone className="h-6 w-6" />
        </Button>

        {/* Emergency Contacts Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Emergency Contacts
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />

              {/* Contacts List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {Object.entries(groupedContacts).map(([category, categoryContacts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold mb-2 capitalize">
                      {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].icon} {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryContacts.map(contact => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          onCall={handleCall}
                          onEmail={handleEmail}
                          onSMS={handleSMS}
                          onEdit={(contact) => {
                            setEditingContact(contact);
                            setIsEditing(true);
                          }}
                          onDelete={handleDeleteContact}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Contact Button */}
              <Button
                onClick={() => {
                  setEditingContact(null);
                  setIsEditing(true);
                }}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Emergency Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <ContactEditDialog
          open={isEditing}
          onClose={() => {
            setIsEditing(false);
            setEditingContact(null);
          }}
          contact={editingContact}
          onSave={handleSaveContact}
        />
      </>
    );
  }

  // Non-floating card view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Emergency Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <div className="space-y-3">
          {Object.entries(groupedContacts).map(([category, categoryContacts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-2 capitalize">
                {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].icon} {category}
              </h3>
              <div className="space-y-2">
                {categoryContacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onCall={handleCall}
                    onEmail={handleEmail}
                    onSMS={handleSMS}
                    onEdit={(contact) => {
                      setEditingContact(contact);
                      setIsEditing(true);
                    }}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            setEditingContact(null);
            setIsEditing(true);
          }}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Emergency Contact
        </Button>

        <ContactEditDialog
          open={isEditing}
          onClose={() => {
            setIsEditing(false);
            setEditingContact(null);
          }}
          contact={editingContact}
          onSave={handleSaveContact}
        />
      </CardContent>
    </Card>
  );
}

// Contact Card Component
function ContactCard({
  contact,
  onCall,
  onEmail,
  onSMS,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  onCall: (phone: string) => void;
  onEmail: (email: string) => void;
  onSMS: (phone: string) => void;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[contact.category];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{contact.name}</h4>
              {contact.isPrimary && (
                <Badge variant="secondary" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{contact.role}</p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCall(contact.phone)}
                className="h-8"
              >
                <Phone className="mr-1 h-3 w-3" />
                Call
              </Button>
              
              {contact.email && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEmail(contact.email!)}
                  className="h-8"
                >
                  <Mail className="mr-1 h-3 w-3" />
                  Email
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSMS(contact.phone)}
                className="h-8"
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                SMS
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(contact)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(contact.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Contact Edit Dialog
function ContactEditDialog({
  open,
  onClose,
  contact,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  contact: EmergencyContact | null;
  onSave: (contact: EmergencyContact) => void;
}) {
  const [formData, setFormData] = useState<Partial<EmergencyContact>>(
    contact || {
      name: '',
      role: '',
      category: 'other',
      phone: '',
      alternatePhone: '',
      email: '',
      notes: '',
      isPrimary: false,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      id: contact?.id || Date.now().toString(),
    } as EmergencyContact);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role/Title *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Wedding Coordinator, Venue Manager"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="alternatePhone">Alternate Phone</Label>
            <Input
              id="alternatePhone"
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Mark as primary contact for this category
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {contact ? 'Update' : 'Add'} Contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}