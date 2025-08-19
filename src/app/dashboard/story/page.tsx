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
  Paper,
  Avatar,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Fab,
  CardActionArea,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Photo as PhotoIcon,
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  AutoStories as StoryIcon,
  Preview as PreviewIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

interface StorySection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'timeline' | 'details';
  isEditing: boolean;
}

interface WeddingDetails {
  coupleName1: string;
  coupleName2: string;
  weddingDate: string;
  venue: string;
  story: string;
  isPublic: boolean;
  websiteUrl?: string;
}

export default function StoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [weddingDetails, setWeddingDetails] = useState<WeddingDetails>({
    coupleName1: 'Sarah',
    coupleName2: 'Michael',
    weddingDate: '2025-06-15',
    venue: 'Garden Wedding Venue',
    story: '',
    isPublic: false,
  });
  const [storySections, setStorySections] = useState<StorySection[]>([]);
  const [isEditingMain, setIsEditingMain] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Initialize story sections
    setStorySections([
      {
        id: '1',
        title: 'How We Met',
        content: 'We met on a rainy Tuesday evening in October at a local coffee shop. Sarah was reading a book about wedding planning (ironically!), and Michael struck up a conversation about her choice in literature. What started as a simple chat about coffee preferences turned into hours of conversation, and we knew there was something special between us.',
        type: 'text',
        isEditing: false,
      },
      {
        id: '2',
        title: 'The Proposal',
        content: 'After three beautiful years together, Michael planned the perfect proposal. He took Sarah back to that same coffee shop where we first met, had them reserve our original table, and got down on one knee right where our love story began. Sarah said yes before he could even finish asking the question!',
        type: 'text',
        isEditing: false,
      },
      {
        id: '3',
        title: 'Our Timeline',
        content: 'October 2021 - First met at the coffee shop\nDecember 2021 - First vacation together\nJune 2022 - Moved in together\nSeptember 2024 - Got engaged\nJune 2025 - Wedding day!',
        type: 'timeline',
        isEditing: false,
      },
      {
        id: '4',
        title: 'Wedding Details',
        content: 'Join us for our special day at the beautiful Garden Wedding Venue. The ceremony will begin at 4:00 PM, followed by cocktails and dinner reception. We can\'t wait to celebrate with all our family and friends!',
        type: 'details',
        isEditing: false,
      },
    ]);
  }, []);

  const handleSaveMainDetails = () => {
    // TODO: Save to API
    setIsEditingMain(false);
  };

  const handleEditSection = (sectionId: string) => {
    setStorySections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, isEditing: true }
          : { ...section, isEditing: false }
      )
    );
  };

  const handleSaveSection = (sectionId: string, newContent: string) => {
    setStorySections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, content: newContent, isEditing: false }
          : section
      )
    );
  };

  const handleUpdateSection = (sectionId: string, newContent: string) => {
    setStorySections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, content: newContent }
          : section
      )
    );
  };

  const togglePublic = () => {
    setWeddingDetails(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'timeline': return <DateIcon />;
      case 'details': return <LocationIcon />;
      default: return <StoryIcon />;
    }
  };

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
              Your Love Story
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your journey and wedding details with your guests
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => router.push('/preview-story')}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={togglePublic}
            >
              {weddingDetails.isPublic ? 'Make Private' : 'Share Publicly'}
            </Button>
          </Box>
        </Box>

        {/* Main Story Header */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <HeartIcon sx={{ fontSize: 32, color: '#FF5722', mr: 1 }} />
                  <Typography
                    variant="h3"
                    sx={{
                      fontFamily: '"Bodoni Moda", serif',
                      fontWeight: 300,
                      fontStyle: 'italic',
                    }}
                  >
                    {weddingDetails.coupleName1} & {weddingDetails.coupleName2}
                  </Typography>
                </Box>
                
                <Typography variant="h5" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 2 }}>
                  {new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  {weddingDetails.venue}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <Chip
                    icon={weddingDetails.isPublic ? <PublicIcon /> : <PrivateIcon />}
                    label={weddingDetails.isPublic ? 'Public Story' : 'Private Story'}
                    color={weddingDetails.isPublic ? 'success' : 'default'}
                  />
                  {weddingDetails.websiteUrl && (
                    <Chip
                      icon={<ShareIcon />}
                      label="Website Available"
                      color="primary"
                    />
                  )}
                </Box>

                <IconButton
                  onClick={() => setIsEditingMain(true)}
                  sx={{
                    bgcolor: '#F5F5F5',
                    '&:hover': { bgcolor: '#EEEEEE' },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Box>

              {isEditingMain && (
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Partner 1 Name"
                        value={weddingDetails.coupleName1}
                        onChange={(e) => setWeddingDetails({ ...weddingDetails, coupleName1: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Partner 2 Name"
                        value={weddingDetails.coupleName2}
                        onChange={(e) => setWeddingDetails({ ...weddingDetails, coupleName2: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Wedding Date"
                        type="date"
                        value={weddingDetails.weddingDate}
                        onChange={(e) => setWeddingDetails({ ...weddingDetails, weddingDate: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Venue"
                        value={weddingDetails.venue}
                        onChange={(e) => setWeddingDetails({ ...weddingDetails, venue: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveMainDetails}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditingMain(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Story Sections */}
        <Box sx={{ px: 3 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.625rem',
              letterSpacing: '0.2em',
              fontWeight: 600,
              fontFamily: '"Bodoni Moda", serif',
              mb: 2,
              display: 'block',
            }}
          >
            YOUR STORY SECTIONS
          </Typography>

          <Grid container spacing={3}>
            {storySections.map((section) => (
              <Grid item xs={12} md={6} key={section.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: '#F5F5F5',
                            color: '#000000',
                            width: 40,
                            height: 40,
                            mr: 2,
                          }}
                        >
                          {getSectionIcon(section.type)}
                        </Avatar>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}
                        >
                          {section.title}
                        </Typography>
                      </Box>
                      {!section.isEditing && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditSection(section.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      {section.isEditing ? (
                        <Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={() => handleSaveSection(section.id, section.content)}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setStorySections(sections =>
                                  sections.map(s =>
                                    s.id === section.id
                                      ? { ...s, isEditing: false }
                                      : s
                                  )
                                );
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          {section.type === 'timeline' ? (
                            <Box>
                              {section.content.split('\n').map((line, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <DateIcon sx={{ fontSize: 16, color: '#999999', mr: 1 }} />
                                  <Typography variant="body2">
                                    {line}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{
                                lineHeight: 1.7,
                                fontStyle: section.type === 'text' ? 'italic' : 'normal',
                              }}
                            >
                              {section.content}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Photo Gallery Section */}
        <Box sx={{ mt: 4, px: 3 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.625rem',
              letterSpacing: '0.2em',
              fontWeight: 600,
              fontFamily: '"Bodoni Moda", serif',
              mb: 2,
              display: 'block',
            }}
          >
            STORY PHOTOS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/photos')}>
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: '#F5F5F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <PhotoIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Add photos to your story
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Website Settings */}
        <Box sx={{ mt: 4, px: 3 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                  fontFamily: '"Bodoni Moda", serif',
                  mb: 2,
                  display: 'block',
                }}
              >
                WEDDING WEBSITE
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 2 }}>
                  Share Your Love Story Online
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Create a beautiful wedding website to share your story, details, and photos with your guests.
                </Typography>

                {weddingDetails.isPublic ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Your wedding website is now public! Share this link with your guests:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F5F5F5', mb: 3 }}>
                      <Typography variant="code" sx={{ fontFamily: 'monospace' }}>
                        https://weddingplanner.com/story/sarah-and-michael
                      </Typography>
                    </Paper>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button variant="outlined" startIcon={<ShareIcon />}>
                        Share Link
                      </Button>
                      <Button variant="outlined" startIcon={<PreviewIcon />}>
                        Preview Website
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                      Your story is currently private. Make it public to create a wedding website.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PublicIcon />}
                      onClick={togglePublic}
                    >
                      Create Wedding Website
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </DashboardLayout>
  );
}