'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import {
  Heart, Edit, Save, Share, Image as ImageIcon, Calendar, MapPin, BookOpen, Eye, Globe, Lock
} from 'lucide-react';
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
      case 'timeline': return <Calendar className="h-5 w-5" />;
      case 'details': return <MapPin className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold">Your Love Story</h1>
                <p className="text-muted-foreground">Share your journey and wedding details with your guests</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push('/preview-story')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                </Button>
                <div className="flex items-center space-x-2">
                    <Switch id="public-switch" checked={weddingDetails.isPublic} onCheckedChange={togglePublic} />
                    <Label htmlFor="public-switch">{weddingDetails.isPublic ? 'Public' : 'Private'}</Label>
                </div>
            </div>
        </div>

        {/* Main Story Header */}
        <Card className="mb-8">
            <CardContent className="p-6">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                        <Heart className="h-8 w-8 text-red-500 mr-2" />
                        <h2 className="text-4xl font-serif">{weddingDetails.coupleName1} & {weddingDetails.coupleName2}</h2>
                    </div>
                    
                    <p className="text-xl font-serif mb-3">
                        {new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>

                    <p className="text-lg text-muted-foreground mb-4">{weddingDetails.venue}</p>

                    <div className="flex justify-center gap-2 mb-4">
                        <Badge variant={weddingDetails.isPublic ? 'success' : 'default'}>
                            {weddingDetails.isPublic ? <Globe className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                            {weddingDetails.isPublic ? 'Public Story' : 'Private Story'}
                        </Badge>
                        {weddingDetails.websiteUrl && (
                            <Badge variant="secondary">
                                <Share className="mr-2 h-4 w-4" />
                                Website Available
                            </Badge>
                        )}
                    </div>

                    <Button variant="outline" size="icon" onClick={() => setIsEditingMain(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>

                {isEditingMain && (
                    <div className="mt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Partner 1 Name"
                                value={weddingDetails.coupleName1}
                                onChange={(e) => setWeddingDetails({ ...weddingDetails, coupleName1: e.target.value })}
                            />
                            <Input
                                placeholder="Partner 2 Name"
                                value={weddingDetails.coupleName2}
                                onChange={(e) => setWeddingDetails({ ...weddingDetails, coupleName2: e.target.value })}
                            />
                            <Input
                                type="date"
                                value={weddingDetails.weddingDate}
                                onChange={(e) => setWeddingDetails({ ...weddingDetails, weddingDate: e.target.value })}
                            />
                            <Input
                                placeholder="Venue"
                                value={weddingDetails.venue}
                                onChange={(e) => setWeddingDetails({ ...weddingDetails, venue: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleSaveMainDetails}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditingMain(false)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Story Sections */}
        <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">Your Story Sections</h3>
            <div className="grid md:grid-cols-2 gap-6">
                {storySections.map((section) => (
                    <Card key={section.id} className="h-full flex flex-col">
                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback>{getSectionIcon(section.type)}</AvatarFallback>
                                    </Avatar>
                                    <h4 className="text-xl font-semibold">{section.title}</h4>
                                </div>
                                {!section.isEditing && (
                                    <Button variant="ghost" size="icon" onClick={() => handleEditSection(section.id)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1">
                                {section.isEditing ? (
                                    <div>
                                        <Textarea
                                            value={section.content}
                                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                            className="min-h-[150px] mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSaveSection(section.id, section.content)}>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setStorySections(sections =>
                                                    sections.map(s =>
                                                        s.id === section.id
                                                            ? { ...s, isEditing: false }
                                                            : s
                                                    )
                                                );
                                            }}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {section.type === 'timeline' ? (
                                            <div className="space-y-2">
                                                {section.content.split('\n').map((line, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                                                        <p>{line}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground leading-relaxed italic">
                                                {section.content}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">Story Photos</h3>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="cursor-pointer" onClick={() => router.push('/dashboard/photos')}>
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex flex-col items-center justify-center h-[200px]">
                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Add photos to your story</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        {/* Website Settings */}
        <div className="mt-8">
            <Card>
                <CardContent className="p-6 text-center">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">Wedding Website</h3>
                    <h4 className="text-xl font-semibold mb-2">Share Your Love Story Online</h4>
                    <p className="text-muted-foreground mb-4">Create a beautiful wedding website to share your story, details, and photos with your guests.</p>

                    {weddingDetails.isPublic ? (
                        <div>
                            <p className="mb-2">Your wedding website is now public! Share this link with your guests:</p>
                            <div className="bg-muted p-2 rounded-md mb-4">
                                <code className="text-sm">https://weddingplanner.com/story/sarah-and-michael</code>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline"><Share className="mr-2 h-4 w-4" /> Share Link</Button>
                                <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Preview Website</Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="mb-4">Your story is currently private. Make it public to create a wedding website.</p>
                            <Button size="lg" onClick={togglePublic}>
                                <Globe className="mr-2 h-4 w-4" />
                                Create Wedding Website
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}