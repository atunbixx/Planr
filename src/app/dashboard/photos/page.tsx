'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Image, Folder, Upload, Trash2, Share2, Download, Heart, Library, Camera, Edit } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { themeMode } = useCustomTheme();
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
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;
    return (
      <LoadingLayout>
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
      </LoadingLayout>
    );
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  return (
    <Layout>
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between mb-3 px-3">
          <div>
            <h1 className="text-2xl font-bodoni-moda">Photo Gallery</h1>
            <p className="text-sm text-gray-500">Collect and organize your wedding memories</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenUploadDialog(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
            <Button
              onClick={() => setOpenAlbumDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Album
            </Button>
          </div>
        </div>

        {selectedAlbum ? (
          // Album View - Show photos in selected album
          <div className="px-3">
            <div className="flex items-center mb-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedAlbum(null)}
                className="mr-2"
              >
                ← Back to Albums
              </Button>
              <div>
                <h2 className="text-xl font-bodoni-moda">{selectedAlbum.name}</h2>
                <p className="text-sm text-gray-500">{selectedAlbum.photoCount} photos • {selectedAlbum.isShared ? 'Shared' : 'Private'}</p>
              </div>
            </div>

            {photos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-lg font-bodoni-moda text-gray-500">No photos yet</h3>
                  <p className="text-sm text-gray-500 mb-3">Upload your first photos to this album</p>
                  <Button
                    onClick={() => setOpenUploadDialog(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-md group relative">
                    <div
                      className="w-full h-48 bg-gray-100 flex items-center justify-center relative"
                    >
                      <Image className="h-12 w-12 text-gray-300" />
                      
                      {/* Photo Actions Overlay */}
                      <div
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFavorite(photo.id)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Heart className={`h-4 w-4 ${photo.isFavorite ? 'text-red-500' : 'text-gray-500'}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-white/90 hover:bg-white"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <p className="text-sm font-bodoni-moda truncate">{photo.caption || photo.filename}</p>
                      <p className="text-xs text-gray-500 truncate">{photo.tags.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Albums View - Show all albums
          <div className="px-3">
            <h4 className="text-xs tracking-widest font-semibold font-bodoni-moda mb-2">PHOTO ALBUMS</h4>

            {albums.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Library className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-lg font-bodoni-moda text-gray-500">No albums yet</h3>
                  <p className="text-sm text-gray-500 mb-3">Create your first album to organize your photos</p>
                  <Button
                    onClick={() => setOpenAlbumDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Album
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {albums.map((album) => (
                  <Card key={album.id} className="transition-all hover:shadow-md hover:-translate-y-1">
                    <div onClick={() => setSelectedAlbum(album)} className="cursor-pointer">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                        <Image className="h-12 w-12 text-gray-300" />
                        
                        {album.isShared && (
                          <Badge className="absolute top-2 right-2">Shared</Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="text-lg font-bodoni-moda mb-1">{album.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{album.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">{album.photoCount} photos</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAlbum(album.id);
                            }}
                            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Album Dialog */}
        <Dialog open={openAlbumDialog} onOpenChange={setOpenAlbumDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Album</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Album Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAlbumDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateAlbum}>Create Album</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Photos Dialog */}
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <Upload className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-bodoni-moda">Upload Your Photos</h3>
              <p className="text-sm text-gray-500 mb-3">Select photos to upload to {selectedAlbum?.name || 'your gallery'}</p>
              <Button asChild>
                <label>
                  Choose Photos
                  <input type="file" className="hidden" multiple accept="image/*" />
                </label>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUploadPhotos}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}