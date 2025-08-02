'use client';

import React, { useEffect, useState } from 'react';
import { X, Zap, Clock, Calendar, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
  usage_count: number;
}

interface QuickRepliesProps {
  vendorId?: string;
  onSelect: (content: string) => void;
  onClose: () => void;
  className?: string;
}

export function QuickReplies({ vendorId, onSelect, onClose, className }: QuickRepliesProps) {
  const [templates, setTemplates] = useState<QuickReply[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  const categories = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'greeting', label: 'Greetings', icon: Heart },
    { id: 'booking', label: 'Booking', icon: Calendar },
    { id: 'reminder', label: 'Reminders', icon: Clock },
    { id: 'contract', label: 'Contracts', icon: FileText },
    { id: 'follow_up', label: 'Follow Up', icon: Zap }
  ];

  useEffect(() => {
    loadTemplates();
  }, [vendorId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true);

      if (vendorId) {
        query = query.or(`vendor_id.eq.${vendorId},vendor_id.is.null`);
      } else {
        query = query.is('vendor_id', null);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (template: QuickReply) => {
    onSelect(template.content);
    
    // Update usage count
    await supabase
      .from('message_templates')
      .update({ 
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', template.id);
  };

  const filteredTemplates = templates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  return (
    <Card className={cn('absolute bottom-20 left-4 right-4 max-w-2xl mx-auto z-10', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Quick Replies</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 p-4 border-b overflow-x-auto">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0"
            >
              <Icon className="h-4 w-4 mr-1" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Templates */}
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates available
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium text-sm mb-1">{template.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.content}
                </div>
                {template.usage_count > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Used {template.usage_count} times
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}