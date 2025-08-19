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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Paper,
  InputAdornment,
  Divider,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Business as VendorIcon,
  Star as StarIcon,
  Reply as ReplyIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

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
  const [selectedTab, setSelectedTab] = useState(0);
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
    if (!type) return contacts;
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
        return <VendorIcon />;
      case 'guest':
        return <PeopleIcon />;
      case 'planner':
        return <MessageIcon />;
      default:
        return <MessageIcon />;
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

  const filteredContacts = getContactsByType(
    selectedTab === 0 ? undefined : 
    selectedTab === 1 ? 'vendor' : 
    selectedTab === 2 ? 'guest' : 'planner'
  ).filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ px: 0, py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Communicate with vendors, guests, and your planning team
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenComposeDialog(true)}
          >
            Compose
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ px: 3 }}>
          <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
            {/* Contacts Sidebar */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Search */}
                  <Box sx={{ p: 2, borderBottom: '1px solid #F0F0F0' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Tabs */}
                  <Tabs
                    value={selectedTab}
                    onChange={(e, newValue) => setSelectedTab(newValue)}
                    variant="fullWidth"
                    sx={{ borderBottom: '1px solid #F0F0F0' }}
                  >
                    <Tab 
                      label={
                        <Badge badgeContent={getUnreadCount()} color="error">
                          All
                        </Badge>
                      } 
                    />
                    <Tab 
                      label={
                        <Badge badgeContent={getUnreadCount('vendor')} color="error">
                          Vendors
                        </Badge>
                      } 
                    />
                    <Tab 
                      label={
                        <Badge badgeContent={getUnreadCount('guest')} color="error">
                          Guests
                        </Badge>
                      } 
                    />
                    <Tab 
                      label={
                        <Badge badgeContent={getUnreadCount('planner')} color="error">
                          Team
                        </Badge>
                      } 
                    />
                  </Tabs>

                  {/* Contacts List */}
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {filteredContacts.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <MessageIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          No contacts found
                        </Typography>
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {filteredContacts.map((contact) => (
                          <ListItem
                            key={contact.id}
                            button
                            selected={selectedContact?.id === contact.id}
                            onClick={() => {
                              setSelectedContact(contact);
                              if (contact.unreadCount > 0) {
                                markAsRead(contact.id);
                              }
                            }}
                            sx={{
                              borderBottom: '1px solid #F5F5F5',
                              '&.Mui-selected': {
                                bgcolor: '#F5F5F5',
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#000000', color: '#FFFFFF' }}>
                                {getContactIcon(contact)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: contact.unreadCount > 0 ? 600 : 400,
                                      flex: 1,
                                    }}
                                  >
                                    {contact.name.length > 25 ? contact.name.substring(0, 25) + '...' : contact.name}
                                  </Typography>
                                  {contact.unreadCount > 0 && (
                                    <Badge
                                      badgeContent={contact.unreadCount}
                                      color="error"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="primary">
                                    {getContactTypeLabel(contact.type)}
                                    {contact.category && ` • ${contact.category}`}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      fontWeight: contact.unreadCount > 0 ? 500 : 400,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {contact.lastMessage}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Message View */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {selectedContact ? (
                  <>
                    {/* Message Header */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #F0F0F0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#000000', color: '#FFFFFF', mr: 2 }}>
                            {getContactIcon(selectedContact)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
                              {selectedContact.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedContact.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <IconButton size="small">
                            <StarIcon />
                          </IconButton>
                          <IconButton size="small">
                            <ArchiveIcon />
                          </IconButton>
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    {/* Messages */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                      {messages.map((message) => (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.senderType === 'self' ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              maxWidth: '70%',
                              bgcolor: message.senderType === 'self' ? '#000000' : '#F5F5F5',
                              color: message.senderType === 'self' ? '#FFFFFF' : '#000000',
                            }}
                          >
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {message.content}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>

                    {/* Message Input */}
                    <Box sx={{ p: 2, borderTop: '1px solid #F0F0F0' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          multiline
                          maxRows={3}
                        />
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          sx={{
                            bgcolor: '#000000',
                            color: '#FFFFFF',
                            '&:hover': { bgcolor: '#333333' },
                            '&.Mui-disabled': { bgcolor: '#CCCCCC' },
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <MessageIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, color: '#999999' }} gutterBottom>
                        Select a conversation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Choose a contact from the sidebar to start messaging
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Compose Dialog */}
        <Dialog open={openComposeDialog} onClose={() => setOpenComposeDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Compose New Message</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="To"
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                fullWidth
                placeholder="Enter email address"
              />
              <TextField
                label="Subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                fullWidth
              />
              <TextField
                label="Message"
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                fullWidth
                multiline
                rows={6}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenComposeDialog(false)}>Cancel</Button>
            <Button onClick={handleComposeMessage} variant="contained">
              Send Message
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}