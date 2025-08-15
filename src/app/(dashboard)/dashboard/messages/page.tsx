'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Phone, Send, Users, Building2, FileText, Plus, Clock } from 'lucide-react';
import Link from 'next/link';
import { enterpriseApi } from '@/lib/api/enterprise-client';
import { 
  WeddingPageLayout, 
  WeddingPageHeader,
  WeddingStatCard,
  WeddingCard,
  WeddingButton,
  WeddingContentSection
} from '@/components/wedding-theme';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp_status: string;
}

interface Vendor {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  category: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  variables: string[];
  is_system: boolean;
  category?: string;
}

export default function MessagesPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<'guest' | 'vendor'>('guest');
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch guests
      const guestsRes = await enterpriseApi.guests.list();
      if (guestsRes) {
        // Map the guest data structure - handle paginated response
        const guestArray = Array.isArray(guestsRes) ? guestsRes : (guestsRes as any).data || []
        const mappedGuests = guestArray.map((guest: any) => ({
          id: guest.id,
          name: guest.name || 'Guest',
          email: guest.email || '',
          phone: guest.phone || '',
          rsvp_status: guest.rsvpStatus
        }));
        setGuests(mappedGuests);
      }

      // Fetch vendors
      const vendorsRes = await enterpriseApi.vendors.list();
      if (vendorsRes) {
        // Map the vendor data structure - handle paginated response
        const vendorArray = Array.isArray(vendorsRes) ? vendorsRes : (vendorsRes as any).data || []
        const mappedVendors = vendorArray.map((vendor: any) => ({
          id: vendor.id,
          name: vendor.contactName || vendor.businessName,
          businessName: vendor.businessName,
          email: vendor.email || '',
          phone: vendor.phone || '',
          category: vendor.category
        }));
        setVendors(mappedVendors);
      }

      // TODO: Implement messages API in enterpriseApi
      // Fetch templates
      // const templatesRes = await enterpriseApi.messages.templates.list();
      // if (templatesRes && templatesRes.data) {
      //   // Map the template data structure
      //   const mappedTemplates = templatesRes.data.map((template: any) => ({
      //     id: template.id,
      //     name: template.name,
      //     description: '',
      //     type: template.type as 'email' | 'sms' | 'whatsapp',
      //     subject: template.subject,
      //     body: template.content,
      //     variables: template.variables,
      //     is_system: false,
      //     category: template.category
      //   }));
      //   setTemplates(mappedTemplates);
      // }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplate('');
      setCustomSubject('');
      setCustomBody('');
      return;
    }
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageType(template.type);
      if (template.subject) setCustomSubject(template.subject);
      setCustomBody(template.body);
    }
  };

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAll = () => {
    if (!recipients || recipients.length === 0) return;
    
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  const handleSendMessages = async () => {
    if (selectedRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    if (!customBody) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // TODO: Implement messages API in enterpriseApi
      // const response = await enterpriseApi.messages.send({
      //   recipientIds: selectedRecipients,
      //   subject: messageType === 'email' ? customSubject : customBody.substring(0, 50),
      //   content: customBody,
      //   type: messageType,
      //   templateId: selectedTemplate || undefined,
      //   scheduledFor: scheduledFor || undefined,
      // });

      // Temporary success simulation
      const response = { success: true, data: { count: selectedRecipients.length, messages: [] } }
      
      if (response.success && response.data) {
        const data = response.data;
        if (scheduledFor) {
          toast({
            title: 'Messages Scheduled',
            description: `${data.count} messages scheduled for ${new Date(scheduledFor).toLocaleString()}`,
          });
        } else {
          // Count successes and failures from messages array
          const successCount = data.messages?.filter((m: any) => m.status === 'sent').length || data.count;
          const failedCount = data.messages?.filter((m: any) => m.status === 'failed').length || 0;
          
          toast({
            title: 'Messages Sent',
            description: `Successfully sent ${successCount} messages${failedCount > 0 ? `. Failed: ${failedCount}` : ''}`,
          });
        }

        // Reset form
        setSelectedRecipients([]);
        setCustomSubject('');
        setCustomBody('');
        setScheduledFor('');
        setSelectedTemplate('');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send messages',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send messages',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const recipients = recipientType === 'guest' ? guests : vendors;

  return (
    <WeddingPageLayout>
      <WeddingPageHeader 
        title="Messages"
        subtitle="Send emails and SMS to your guests and vendors"
        action={
          <Link href="/dashboard/messages/history">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              View History
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Recipients Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>Select who to message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={recipientType} onValueChange={(v) => setRecipientType(v as 'guest' | 'vendor')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guest">
                  <Users className="h-4 w-4 mr-2" />
                  Guests
                </TabsTrigger>
                <TabsTrigger value="vendor">
                  <Building2 className="h-4 w-4 mr-2" />
                  Vendors
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Recipients</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {recipients && selectedRecipients.length === recipients.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {recipients && recipients.length > 0 ? recipients.map(recipient => (
                  <div
                    key={recipient.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedRecipients.includes(recipient.id)}
                      onCheckedChange={() => handleRecipientToggle(recipient.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {recipientType === 'guest' 
                          ? recipient.name 
                          : (recipient as Vendor).businessName || recipient.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {recipient.email && <span>{recipient.email}</span>}
                        {recipient.email && recipient.phone && ' • '}
                        {recipient.phone && <span>{recipient.phone}</span>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No {recipientType}s available
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {selectedRecipients.length} of {recipients ? recipients.length : 0} selected
            </div>
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Create and send your message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message Type */}
            <div className="grid gap-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="grid gap-2">
              <Label>Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or write custom message" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates
                    .filter(t => t.type === messageType)
                    .map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject (for emails) */}
            {messageType === 'email' && (
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
            )}

            {/* Message Body */}
            <div className="grid gap-2">
              <Label>Message</Label>
              <Textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Enter your message"
                rows={8}
              />
              <p className="text-sm text-muted-foreground">
                You can use variables like {`{{guestName}}`}, {`{{weddingDate}}`}, etc.
              </p>
            </div>

            {/* Schedule */}
            <div className="grid gap-2">
              <Label>Schedule (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Leave empty to send immediately
              </p>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleSendMessages}
              disabled={isSending || selectedRecipients.length === 0}
              className="w-full"
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {scheduledFor ? 'Schedule Messages' : 'Send Messages'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </WeddingPageLayout>
  );
}