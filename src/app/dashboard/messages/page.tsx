'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  Send, Search, Paperclip, MoreVertical, MessageSquare, Users, Building, Star, Reply, Archive, Trash2, Plus, User, Bot
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'vendor' | 'guest' | 'planner' | 'self';
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  threadId: string;
  attachments?: string[];
}

interface Contact {
  id: string;
  name: string;
  type: 'vendor' | 'guest' | 'planner';
  category?: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [openComposeDialog, setOpenComposeDialog] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Mock contacts data
    setContacts([
      {
        id: '1',
        name: 'Sarah Miller - Wedding Planner',
        type: 'planner',
        email: 'sarah@weddingplanner.com',
        lastMessage: 'Perfect! I\'ll coordinate with the venue for the setup.',
        lastMessageTime: '2024-08-17T10:30:00Z',
        unreadCount: 2,
      },
      {
        id: '2',
        name: 'Garden Venue Coordinator',
        type: 'vendor',
        category: 'Venue',
        email: 'events@gardenvenue.com',
        lastMessage: 'Your venue is confirmed for June 15th!',
        lastMessageTime: '2024-08-17T09:15:00Z',
        unreadCount: 0,
      },
      {
        id: '3',
        name: 'David Chen - Photographer',
        type: 'vendor',
        category: 'Photography',
        email: 'david@photographystudio.com',
        lastMessage: 'I\'d love to schedule our engagement session soon.',
        lastMessageTime: '2024-08-16T16:45:00Z',
        unreadCount: 1,
      },
      {
        id: '4',
        name: 'Emma Thompson',
        type: 'guest',
        email: 'emma.thompson@email.com',
        lastMessage: 'So excited for your wedding! Can\'t wait to celebrate.',
        lastMessageTime: '2024-08-16T14:20:00Z',
        unreadCount: 0,
      },
      {
        id: '5',
        name: 'Elegant Catering Co.',
        type: 'vendor',
        category: 'Catering',
        email: 'info@elegantcatering.com',
        lastMessage: 'Here\'s the updated menu for your tasting.',
        lastMessageTime: '2024-08-15T11:30:00Z',
        unreadCount: 0,
      },
    ]);

    // Mock messages for selected contact
    if (selectedContact) {
      setMessages([
        {
          id: '1',
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderType: selectedContact.type,
          subject: 'Wedding Venue Confirmation',
          content: selectedContact.lastMessage || 'Hello! Looking forward to working with you.',
          timestamp: selectedContact.lastMessageTime || '2024-08-17T10:00:00Z',
          isRead: selectedContact.unreadCount === 0,
          isStarred: false,
          threadId: 'thread-1',
        },
        {
          id: '2',
          senderId: 'self',
          senderName: 'You',
          senderType: 'self',
          subject: 'Re: Wedding Venue Confirmation',
          content: 'Thank you so much! This is wonderful news. What are the next steps?',
          timestamp: '2024-08-17T10:45:00Z',
          isRead: true,
          isStarred: false,
          threadId: 'thread-1',
        },
      ]);
    }
  }, [selectedContact]);

  const getContactsByType = (type?: string) => {
    if (!type || type === 'all') return contacts;
    return contacts.filter(contact => contact.type === type);
  };

  const getUnreadCount = (type?: string) => {
    const typeContacts = getContactsByType(type);
    return typeContacts.reduce((sum, contact) => sum + contact.unreadCount, 0);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'self',
      senderName: 'You',
      senderType: 'self',
      subject: 'Re: Conversation',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      threadId: 'thread-1',
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleComposeMessage = () => {
    // TODO: Send new message via API
    setOpenComposeDialog(false);
    setComposeData({ to: '', subject: '', content: '' });
  };

  const toggleStar = (messageId: string) => {
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ));
  };

  const markAsRead = (contactId: string) => {
    setContacts(contacts.map(contact =>
      contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
    ));
  };

  const getContactIcon = (contact: Contact) => {
    switch (contact.type) {
      case 'vendor':
        return <Building />;
      case 'guest':
        return <Users />;
      case 'planner':
        return <Bot />;
      default:
        return <User />;
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'vendor': return 'Vendor';
      case 'guest': return 'Guest';
      case 'planner': return 'Planner';
      default: return 'Contact';
    }
  };

  const filteredContacts = getContactsByType(selectedTab).filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-muted-foreground">Communicate with vendors, guests, and your planning team</p>
            </div>
            <Button onClick={() => setOpenComposeDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Compose
            </Button>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-[350px_1fr] gap-4 flex-1">
            {/* Contacts Sidebar */}
            <Card className="flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All <Badge className="ml-2">{getUnreadCount('all')}</Badge></TabsTrigger>
                        <TabsTrigger value="vendor">Vendors <Badge className="ml-2">{getUnreadCount('vendor')}</Badge></TabsTrigger>
                        <TabsTrigger value="guest">Guests <Badge className="ml-2">{getUnreadCount('guest')}</Badge></TabsTrigger>
                        <TabsTrigger value="team">Team <Badge className="ml-2">{getUnreadCount('planner')}</Badge></TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-auto">
                        {filteredContacts.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-muted-foreground">No contacts found</p>
                            </div>
                        ) : (
                            <div>
                                {filteredContacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 cursor-pointer border-b",
                                            selectedContact?.id === contact.id && "bg-muted"
                                        )}
                                        onClick={() => {
                                            setSelectedContact(contact);
                                            if (contact.unreadCount > 0) {
                                                markAsRead(contact.id);
                                            }
                                        }}
                                    >
                                        <Avatar>
                                            <AvatarFallback>{getContactIcon(contact)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("font-semibold truncate", contact.unreadCount > 0 && "font-bold")}>
                                                    {contact.name}
                                                </p>
                                                {contact.unreadCount > 0 && (
                                                    <Badge variant="error">{contact.unreadCount}</Badge>
                                                )}
                                            </div>
                                            <p className={cn("text-sm text-muted-foreground truncate", contact.unreadCount > 0 && "font-semibold text-primary")}>
                                                {contact.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Tabs>
            </Card>

            {/* Message View */}
            <Card className="flex flex-col h-full">
                {selectedContact ? (
                    <>
                        {/* Message Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{getContactIcon(selectedContact)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{selectedContact.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon"><Star className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Star</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Archive</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>More</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex items-end gap-2",
                                        message.senderType === 'self' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.senderType !== 'self' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{getContactIcon(selectedContact)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-lg p-3 max-w-[70%]",
                                            message.senderType === 'self'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                        <p className="text-xs text-right opacity-70 mt-1">
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t">
                            <div className="relative">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    className="pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Attach File</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Select a conversation</h3>
                        <p className="text-muted-foreground">Choose a contact from the sidebar to start messaging</p>
                    </div>
                )}
            </Card>
        </div>

        {/* Compose Dialog */}
        <Dialog open={openComposeDialog} onOpenChange={setOpenComposeDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compose New Message</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        placeholder="To: Enter email address"
                        value={composeData.to}
                        onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    />
                    <Input
                        placeholder="Subject"
                        value={composeData.subject}
                        onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    />
                    <textarea
                        placeholder="Message"
                        value={composeData.content}
                        onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                        className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenComposeDialog(false)}>Cancel</Button>
                    <Button onClick={handleComposeMessage}>Send Message</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}