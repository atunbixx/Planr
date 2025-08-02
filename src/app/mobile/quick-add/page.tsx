'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';

type QuickAddType = 'vendor' | 'guest' | 'task' | 'note';

interface QuickAddOption {
  type: QuickAddType;
  label: string;
  icon: string;
  fields: string[];
  color: string;
}

const quickAddOptions: QuickAddOption[] = [
  {
    type: 'vendor',
    label: 'Vendor',
    icon: 'fas fa-store',
    fields: ['name', 'category', 'phone', 'email'],
    color: 'bg-purple-500',
  },
  {
    type: 'guest',
    label: 'Guest',
    icon: 'fas fa-user-plus',
    fields: ['name', 'email', 'phone', 'plus_one'],
    color: 'bg-blue-500',
  },
  {
    type: 'task',
    label: 'Task',
    icon: 'fas fa-plus-square',
    fields: ['title', 'description', 'due_date', 'priority'],
    color: 'bg-green-500',
  },
  {
    type: 'note',
    label: 'Note',
    icon: 'fas fa-sticky-note',
    fields: ['title', 'content'],
    color: 'bg-yellow-500',
  },
];

export default function QuickAddPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<QuickAddType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleTypeSelect = (type: QuickAddType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setSelectedType(type);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }

    // Here you would normally save to the database
    showToast({
      title: 'Success!',
      description: `${selectedType} added successfully`,
      variant: 'success',
    });

    // Navigate to the appropriate page
    switch (selectedType) {
      case 'vendor':
        router.push('/dashboard/vendors');
        break;
      case 'guest':
        router.push('/dashboard/guests');
        break;
      case 'task':
        router.push('/dashboard/tasks');
        break;
      case 'note':
        router.push('/dashboard');
        break;
    }
  };

  const getFieldLabel = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFieldType = (field: string) => {
    if (field === 'email') return 'email';
    if (field === 'phone') return 'tel';
    if (field === 'due_date') return 'date';
    if (field === 'content' || field === 'description') return 'textarea';
    return 'text';
  };

  const selectedOption = quickAddOptions.find(opt => opt.type === selectedType);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        title={selectedType ? `Add ${selectedOption?.label}` : 'Quick Add'} 
        showBack 
      />

      <div className="p-4 pb-20">
        {!selectedType ? (
          <>
            <p className="text-gray-600 mb-6">What would you like to add?</p>
            
            <div className="grid grid-cols-2 gap-4">
              {quickAddOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleTypeSelect(option.type)}
                  className={cn(
                    "p-6 rounded-lg text-white flex flex-col items-center justify-center space-y-3 transition-transform active:scale-95",
                    option.color
                  )}
                >
                  <i className={cn(option.icon, "text-3xl")} />
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedOption?.fields.map((field) => {
              const fieldType = getFieldType(field);
              const label = getFieldLabel(field);

              if (fieldType === 'textarea') {
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                      rows={4}
                      value={formData[field] || ''}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                );
              }

              if (field === 'priority') {
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority })}
                          className={cn(
                            "py-2 px-4 rounded-lg font-medium capitalize transition-colors",
                            formData.priority === priority
                              ? "bg-accent text-white"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (field === 'plus_one') {
                return (
                  <div key={field} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Has Plus One?
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        plus_one: formData.plus_one === 'yes' ? 'no' : 'yes' 
                      })}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        formData.plus_one === 'yes' ? "bg-accent" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          formData.plus_one === 'yes' ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <Input
                    type={fieldType}
                    value={formData[field] || ''}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    className="h-12"
                  />
                </div>
              );
            })}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setSelectedType(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12"
              >
                Add {selectedOption?.label}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}