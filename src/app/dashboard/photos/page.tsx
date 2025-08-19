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
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Fab,
  CircularProgress,
  CardActionArea,
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoLibrary as PhotoIcon,
  Folder as FolderIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  Collections as AlbumIcon,
  Camera as CameraIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

interface PhotoAlbum {
  id: string;
  name: string;
  description: string;
  coverPhoto?: string;
  photoCount: number;
  createdAt: string;
  isShared: boolean;
}

interface Photo {
  id: string;
  albumId: string;
  url: string;
  filename: string;
  caption?: string;
  tags: string[];
  isFavorite: boolean;
  uploadedAt: string;
}

export default function PhotosPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [openAlbumDialog, setOpenAlbumDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Mock photo albums
    setAlbums([
      {
        id: '1',
        name: 'Engagement Photos',
        description: 'Beautiful moments from our engagement session',
        coverPhoto: '/placeholder-engagement.jpg',
        photoCount: 24,
        createdAt: '2024-12-01',
        isShared: true,
      },
      {
        id: '2',
        name: 'Venue Visit',
        description: 'Photos from our venue walkthrough',
        coverPhoto: '/placeholder-venue.jpg',
        photoCount: 12,
        createdAt: '2024-11-15',
        isShared: false,
      },
      {
        id: '3',
        name: 'Inspiration Board',
        description: 'Ideas and inspiration for our special day',
        coverPhoto: '/placeholder-inspiration.jpg',
        photoCount: 8,
        createdAt: '2024-10-20',
        isShared: false,
      },
    ]);

    // Mock photos for selected album
    if (selectedAlbum) {
      setPhotos([
        {
          id: '1',
          albumId: selectedAlbum.id,
          url: '/placeholder-photo1.jpg',
          filename: 'engagement-001.jpg',
          caption: 'Our favorite moment',
          tags: ['romantic', 'sunset'],
          isFavorite: true,
          uploadedAt: '2024-12-01',
        },
        {
          id: '2',
          albumId: selectedAlbum.id,
          url: '/placeholder-photo2.jpg',
          filename: 'engagement-002.jpg',
          caption: 'Laughing together',
          tags: ['candid', 'happy'],
          isFavorite: false,
          uploadedAt: '2024-12-01',
        },
      ]);
    }
  }, [selectedAlbum]);

  const handleCreateAlbum = () => {
    // TODO: Create album via API
    setOpenAlbumDialog(false);
    setFormData({ name: '', description: '' });
  };

  const handleUploadPhotos = () => {
    // TODO: Handle photo upload
    setOpenUploadDialog(false);
  };

  const handleDeleteAlbum = (albumId: string) => {
    // TODO: Delete album via API
    setAlbums(albums.filter(album => album.id !== albumId));
  };

  const toggleFavorite = (photoId: string) => {
    setPhotos(photos.map(photo => 
      photo.id === photoId 
        ? { ...photo, isFavorite: !photo.isFavorite }
        : photo
    ));
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
              Photo Gallery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Collect and organize your wedding memories
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
            >
              Upload Photos
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAlbumDialog(true)}
            >
              Create Album
            </Button>
          </Box>
        </Box>

        {selectedAlbum ? (
          // Album View - Show photos in selected album
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                onClick={() => setSelectedAlbum(null)}
                sx={{ mr: 2 }}
              >
                ← Back to Albums
              </Button>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
                  {selectedAlbum.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedAlbum.photoCount} photos • {selectedAlbum.isShared ? 'Shared' : 'Private'}
                </Typography>
              </Box>
            </Box>

            {photos.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <CameraIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, color: '#999999' }} gutterBottom>
                    No photos yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Upload your first photos to this album
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setOpenUploadDialog(true)}
                  >
                    Upload Photos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ImageList cols={4} gap={16}>
                {photos.map((photo) => (
                  <ImageListItem key={photo.id} sx={{ overflow: 'hidden', borderRadius: 0 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 200,
                        bgcolor: '#F5F5F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        '&:hover .photo-actions': {
                          opacity: 1,
                        },
                      }}
                    >
                      <PhotoIcon sx={{ fontSize: 48, color: '#CCCCCC' }} />
                      
                      {/* Photo Actions Overlay */}
                      <Box
                        className="photo-actions"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => toggleFavorite(photo.id)}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                          }}
                        >
                          <FavoriteIcon 
                            sx={{ 
                              fontSize: 16,
                              color: photo.isFavorite ? '#FF5722' : '#999999',
                            }} 
                          />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                          }}
                        >
                          <ShareIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <ImageListItemBar
                      title={photo.caption || photo.filename}
                      subtitle={`${photo.tags.join(', ')}`}
                      sx={{
                        '& .MuiImageListItemBar-title': {
                          fontSize: '0.875rem',
                          fontFamily: '"Bodoni Moda", serif',
                        },
                        '& .MuiImageListItemBar-subtitle': {
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
        ) : (
          // Albums View - Show all albums
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
              PHOTO ALBUMS
            </Typography>

            {albums.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <AlbumIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, color: '#999999' }} gutterBottom>
                    No albums yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create your first album to organize your photos
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAlbumDialog(true)}
                  >
                    Create First Album
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {albums.map((album) => (
                  <Grid item xs={12} sm={6} md={4} key={album.id}>
                    <Card
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardActionArea onClick={() => setSelectedAlbum(album)}>
                        <Box
                          sx={{
                            height: 200,
                            bgcolor: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          <PhotoIcon sx={{ fontSize: 48, color: '#CCCCCC' }} />
                          
                          {album.isShared && (
                            <Chip
                              label="Shared"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#000000',
                                color: '#FFFFFF',
                              }}
                            />
                          )}
                        </Box>
                        
                        <CardContent>
                          <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 1 }}>
                            {album.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {album.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {album.photoCount} photos
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album.id);
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Create Album Dialog */}
        <Dialog open={openAlbumDialog} onClose={() => setOpenAlbumDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Album</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Album Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAlbumDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAlbum} variant="contained">
              Create Album
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Photos Dialog */}
        <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <UploadIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 2 }} />
              <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }} gutterBottom>
                Upload Your Photos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select photos to upload to {selectedAlbum?.name || 'your gallery'}
              </Typography>
              <Button variant="contained" component="label">
                Choose Photos
                <input type="file" hidden multiple accept="image/*" />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadPhotos} variant="contained">
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}