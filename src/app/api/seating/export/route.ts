import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { seatingPlannerService } from '@/lib/api/seating-planner';
import { SeatingChartExporter } from '@/lib/export/seating-exporter';

// POST /api/seating/export - Export seating chart
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { layoutId, format, options } = body;

    if (!layoutId || !format) {
      return NextResponse.json(
        { error: 'Layout ID and format required' },
        { status: 400 }
      );
    }

    if (!['pdf', 'png', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf, png, or csv' },
        { status: 400 }
      );
    }

    // Get layout with all details
    const layout = await seatingPlannerService().getLayoutWithDetails(layoutId);
    if (!layout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
    }

    // Get event details
    const event = await seatingPlannerService().getEventDetails(layout.eventId);

    // Initialize exporter
    const exporter = new SeatingChartExporter(layout);

    // Export based on format
    const result = await exporter.export({
      format,
      eventName: event.name,
      eventDate: event.date,
      venueName: event.venueName || 'Venue',
      showTableNumbers: options?.showTableNumbers ?? true,
      showGuestNames: options?.showGuestNames ?? true,
      showMealChoices: options?.showMealChoices ?? false,
      showNotes: options?.showNotes ?? false,
      pageSize: options?.pageSize || 'A4',
      orientation: options?.orientation || 'landscape',
      scale: options?.scale || 1,
      canvasWidth: options?.canvasWidth || 1200,
      canvasHeight: options?.canvasHeight || 800,
      backgroundColor: options?.backgroundColor || '#ffffff'
    });

    // Return appropriate response based on format
    if (format === 'csv') {
      return new NextResponse(result as string, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="seating-chart-${layoutId}.csv"`
        }
      });
    } else {
      // For PDF and PNG, convert blob to base64
      const blob = result as Blob;
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      return NextResponse.json({
        format,
        data: base64,
        mimeType: format === 'pdf' ? 'application/pdf' : 'image/png',
        filename: `seating-chart-${layoutId}.${format}`
      });
    }
  } catch (error) {
    console.error('Error exporting seating chart:', error);
    return NextResponse.json(
      { error: 'Failed to export seating chart' },
      { status: 500 }
    );
  }
}

// GET /api/seating/export/preview - Get export preview
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const layoutId = request.nextUrl.searchParams.get('layoutId');
    if (!layoutId) {
      return NextResponse.json({ error: 'Layout ID required' }, { status: 400 });
    }

    // Return export options and preview data
    return NextResponse.json({
      formats: ['pdf', 'png', 'csv'],
      options: {
        pdf: {
          pageSizes: ['A4', 'Letter', 'A3'],
          orientations: ['portrait', 'landscape']
        },
        png: {
          resolutions: [
            { width: 1200, height: 800, label: 'Standard (1200x800)' },
            { width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
            { width: 2400, height: 1600, label: 'High Res (2400x1600)' }
          ]
        },
        csv: {
          includeOptions: [
            'tableNumbers',
            'guestNames',
            'mealChoices',
            'dietaryRestrictions',
            'notes'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Error getting export preview:', error);
    return NextResponse.json(
      { error: 'Failed to get export preview' },
      { status: 500 }
    );
  }
}