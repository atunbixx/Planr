'use client';

import { useState, useEffect } from 'react';
import { SafeFeatureWrapper } from '@/components/SafeFeatureWrapper';
import { safeApiCall, createFeatureApiClient } from '@/lib/api/safe-fetch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Grid3X3, Save, AlertCircle } from 'lucide-react';

// Create a dedicated API client for the seating feature
const seatingApi = createFeatureApiClient('SEATING_PLANNER');

interface Table {
  id: string;
  name: string;
  capacity: number;
  assignedGuests: string[];
}

interface SeatingData {
  tables: Table[];
  unassignedGuests: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Seating planner component with full safety features
 */
function SeatingPlannerContent() {
  const [seatingData, setSeatingData] = useState<SeatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load seating data
  useEffect(() => {
    loadSeatingData();
  }, []);

  const loadSeatingData = async () => {
    setLoading(true);
    setError(null);

    const result = await seatingApi.get<SeatingData>('/api/seating', {
      fallbackData: {
        tables: [],
        unassignedGuests: [],
      },
    });

    if (result.error) {
      setError(result.error);
      // Use fallback data if provided
      if (result.data) {
        setSeatingData(result.data);
      }
    } else if (result.data) {
      setSeatingData(result.data);
    }

    setLoading(false);
  };

  const saveSeatingArrangement = async () => {
    if (!seatingData) return;

    setSaving(true);
    setError(null);

    const result = await seatingApi.post('/api/seating', seatingData);

    if (result.error) {
      setError('Failed to save seating arrangement. Please try again.');
    } else {
      // Show success message
      alert('Seating arrangement saved successfully!');
    }

    setSaving(false);
  };

  if (loading) {
    return <SeatingPlannerSkeleton />;
  }

  if (error && !seatingData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="link"
            onClick={loadSeatingData}
            className="ml-2 p-0 h-auto"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seating Planner</h1>
          <p className="text-muted-foreground">
            Organize your guests' seating arrangements
          </p>
        </div>
        <Button
          onClick={saveSeatingArrangement}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Arrangement'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Tables
              </CardTitle>
              <CardDescription>
                {seatingData?.tables.length || 0} tables configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seatingData?.tables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tables configured yet.</p>
                  <Button variant="outline" className="mt-4">
                    Add Your First Table
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seatingData?.tables.map((table) => (
                    <Card key={table.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{table.name}</CardTitle>
                        <CardDescription>
                          {table.assignedGuests.length}/{table.capacity} guests
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Guests Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unassigned Guests
              </CardTitle>
              <CardDescription>
                {seatingData?.unassignedGuests.length || 0} guests to be seated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seatingData?.unassignedGuests.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  All guests have been assigned!
                </p>
              ) : (
                <div className="space-y-2">
                  {seatingData?.unassignedGuests.slice(0, 10).map((guest) => (
                    <div
                      key={guest.id}
                      className="p-2 border rounded hover:bg-accent cursor-pointer"
                    >
                      {guest.name}
                    </div>
                  ))}
                  {(seatingData?.unassignedGuests.length || 0) > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {seatingData!.unassignedGuests.length - 10} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for seating planner
 */
function SeatingPlannerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback component when feature is disabled
 */
function SeatingPlannerFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Seating Planner Coming Soon!</CardTitle>
          <CardDescription>
            We're putting the finishing touches on the seating planner.
            Check back soon to organize your guest seating arrangements.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

/**
 * Safe seating page with feature flag protection
 */
export default function SafeSeatingPage() {
  return (
    <SafeFeatureWrapper
      feature="SEATING_PLANNER"
      fallback={<SeatingPlannerFallback />}
      errorFallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The seating planner is temporarily unavailable. Please try again later.
          </AlertDescription>
        </Alert>
      }
    >
      <SeatingPlannerContent />
    </SafeFeatureWrapper>
  );
}