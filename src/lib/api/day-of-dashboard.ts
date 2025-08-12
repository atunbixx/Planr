import { DayOfConfig, EmergencyContact, GuestCheckIn, PrismaClient, TimelineEvent, VendorCheckIn, WeatherUpdate, WeddingDayIssue } from '@prisma/client';

// Define enums locally since they're not in Prisma schema
export enum EventStatus {
  scheduled = 'scheduled',
  in_progress = 'in_progress',
  completed = 'completed',
  delayed = 'delayed',
  cancelled = 'cancelled'
}

export enum VendorCheckInStatus {
  not_arrived = 'not_arrived',
  checked_in = 'checked_in',
  setup_complete = 'setup_complete',
  departed = 'departed'
}

export enum IssuePriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  critical = 'critical'
}

export enum IssueStatus {
  open = 'open',
  in_progress = 'in_progress',
  resolved = 'resolved'
}

export enum WeatherCondition {
  clear = 'clear',
  partly_cloudy = 'partly_cloudy',
  cloudy = 'cloudy',
  light_rain = 'light_rain',
  heavy_rain = 'heavy_rain',
  storm = 'storm',
  snow = 'snow'
}
import { cache } from 'react';
import { z } from 'zod';
import { authGuard } from '@/lib/api/auth';

const prisma = new PrismaClient();

// Types and DTOs
export interface TimelineEventWithVendor extends TimelineEvent {
  responsible_vendor?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
}

export interface VendorCheckInWithDetails extends VendorCheckIn {
  vendor: {
    id: string;
    name: string;
    category: string;
    phone: string | null;
    email: string | null;
  };
}

export interface WeddingDayIssueWithDetails extends WeddingDayIssue {
  related_vendor?: {
    id: string;
    name: string;
  };
  related_event?: {
    id: string;
    event_name: string;
  };
  reported_by_user?: {
    id: string;
    email: string;
  };
}

export interface DashboardSummary {
  config: DayOfConfig | null;
  timeline: {
    total_events: number;
    completed: number;
    in_progress: number;
    upcoming: number;
    delayed: number;
  };
  vendors: {
    total: number;
    checked_in: number;
    setup_complete: number;
    not_arrived: number;
  };
  guests: {
    total_expected: number;
    checked_in: number;
    table_confirmed: number;
    meals_served: number;
  };
  issues: {
    total: number;
    critical: number;
    high: number;
    resolved: number;
    active: number;
  };
  weather: WeatherUpdate | null;
}

// Validation schemas
const createTimelineEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduled_time: z.string().datetime(),
  duration_minutes: z.number().int().positive().default(30),
  location: z.string().optional(),
  responsible_vendor_id: z.string().uuid().optional(),
  responsible_staff: z.string().optional(),
  is_milestone: z.boolean().default(false),
  display_order: z.number().int(),
});

const updateTimelineEventSchema = createTimelineEventSchema.partial().extend({
  status: z.nativeEnum(EventStatus).optional(),
  actual_start_time: z.string().datetime().optional(),
  actual_end_time: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const vendorCheckInSchema = z.object({
  vendorId: z.string().uuid(),
  expected_arrival: z.string().datetime(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  setup_location: z.string().optional(),
  special_instructions: z.string().optional(),
});

const updateCheckInSchema = z.object({
  status: z.nativeEnum(VendorCheckInStatus).optional(),
  actual_arrival: z.string().datetime().optional(),
  setup_start: z.string().datetime().optional(),
  setup_complete: z.string().datetime().optional(),
  departure_time: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.nativeEnum(IssuePriority).default('medium'),
  assigned_to: z.string().optional(),
  related_vendor_id: z.string().uuid().optional(),
  related_event_id: z.string().uuid().optional(),
});

const updateIssueSchema = z.object({
  status: z.nativeEnum(IssueStatus).optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  assigned_to: z.string().optional(),
  resolution_notes: z.string().optional(),
});

const weatherUpdateSchema = z.object({
  temperature_celsius: z.number().optional(),
  temperature_fahrenheit: z.number().optional(),
  condition: z.nativeEnum(WeatherCondition),
  wind_speed_mph: z.number().int().optional(),
  precipitation_chance: z.number().int().min(0).max(100).optional(),
  humidity_percent: z.number().int().min(0).max(100).optional(),
  sunset_time: z.string().optional(),
  notes: z.string().optional(),
});

// Service class
export class DayOfDashboardService {
  // Dashboard Summary
  async getDashboardSummary(coupleId: string): Promise<DashboardSummary> {
    const [config, timeline, vendors, guests, issues, weather] = await Promise.all([
      this.getConfig(coupleId),
      this.getTimelineSummary(coupleId),
      this.getVendorSummary(coupleId),
      this.getGuestSummary(coupleId),
      this.getIssueSummary(coupleId),
      this.getLatestWeather(coupleId),
    ]);

    return {
      config,
      timeline,
      vendors,
      guests,
      issues,
      weather,
    };
  }

  // Configuration Management
  async getConfig(coupleId: string): Promise<DayOfConfig | null> {
    return prisma.dayOfConfig.findUnique({
      where: { coupleId: coupleId },
    });
  }

  async updateConfig(coupleId: string, data: Partial<DayOfConfig>): Promise<DayOfConfig> {
    return prisma.dayOfConfig.upsert({
      where: { coupleId: coupleId },
      update: data,
      create: {
        coupleId: coupleId,
        weddingDate: new Date(),
        ceremony_time: '14:00',
        ...data,
      },
    });
  }

  // Timeline Management
  async getTimeline(coupleId: string): Promise<TimelineEventWithVendor[]> {
    return prisma.timelineEvent.findMany({
      where: { coupleId: coupleId },
      include: {
        responsible_vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { display_order: 'asc' },
    });
  }

  async createTimelineEvent(
    coupleId: string,
    data: z.infer<typeof createTimelineEventSchema>
  ): Promise<TimelineEvent> {
    const validated = createTimelineEventSchema.parse(data);
    
    return prisma.timelineEvent.create({
      data: {
        coupleId: coupleId,
        ...validated,
      },
    });
  }

  async updateTimelineEvent(
    eventId: string,
    data: z.infer<typeof updateTimelineEventSchema>
  ): Promise<TimelineEvent> {
    const validated = updateTimelineEventSchema.parse(data);
    
    // Update actual times based on status changes
    const updateData: any = { ...validated };
    
    if (validated.status === 'in_progress' && !validated.actual_start_time) {
      updateData.actual_start_time = new Date();
    }
    
    if (validated.status === 'completed' && !validated.actual_end_time) {
      updateData.actual_end_time = new Date();
    }
    
    return prisma.timelineEvent.update({
      where: { id: eventId },
      data: updateData,
    });
  }

  async deleteTimelineEvent(eventId: string): Promise<void> {
    await prisma.timelineEvent.delete({
      where: { id: eventId },
    });
  }

  async reorderTimeline(coupleId: string, eventOrder: string[]): Promise<void> {
    const updates = eventOrder.map((eventId, index) =>
      prisma.timelineEvent.update({
        where: { id: eventId },
        data: { display_order: index },
      })
    );
    
    await prisma.$transaction(updates);
  }

  // Vendor Check-in Management
  async getVendorCheckIns(coupleId: string): Promise<VendorCheckInWithDetails[]> {
    const vendors = await prisma.vendor.findMany({
      where: {
        coupleId: coupleId,
        status: 'booked',
      },
      include: {
        vendor_checkins: true,
      },
    });

    return vendors.map(vendor => ({
      ...(vendor.vendor_checkins || {
        id: '',
        vendorId: vendor.id,
        expected_arrival: new Date(),
        status: 'not_arrived' as VendorCheckInStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone,
        email: vendor.email,
      },
    })) as VendorCheckInWithDetails[];
  }

  async createVendorCheckIn(
    data: z.infer<typeof vendorCheckInSchema>,
    checkedInBy?: string
  ): Promise<VendorCheckIn> {
    const validated = vendorCheckInSchema.parse(data);
    
    return prisma.vendorCheckIn.create({
      data: {
        ...validated,
        checked_in_by: checkedInBy,
      },
    });
  }

  async updateVendorCheckIn(
    vendorId: string,
    data: z.infer<typeof updateCheckInSchema>,
    checkedInBy?: string
  ): Promise<VendorCheckIn> {
    const validated = updateCheckInSchema.parse(data);
    
    return prisma.vendorCheckIn.upsert({
      where: { vendorId: vendorId },
      update: {
        ...validated,
        checked_in_by: checkedInBy,
      },
      create: {
        vendorId: vendorId,
        expected_arrival: new Date(),
        status: 'not_arrived',
        ...validated,
        checked_in_by: checkedInBy,
      },
    });
  }

  // Emergency Contacts
  async getEmergencyContacts(coupleId: string): Promise<EmergencyContact[]> {
    return prisma.emergencyContact.findMany({
      where: { coupleId: coupleId },
      orderBy: { priority_order: 'asc' },
    });
  }

  async createEmergencyContact(
    coupleId: string,
    data: Omit<EmergencyContact, 'id' | 'coupleId' | 'createdAt'>
  ): Promise<EmergencyContact> {
    return prisma.emergencyContact.create({
      data: {
        coupleId: coupleId,
        ...data,
      },
    });
  }

  async updateEmergencyContact(
    contactId: string,
    data: Partial<EmergencyContact>
  ): Promise<EmergencyContact> {
    return prisma.emergencyContact.update({
      where: { id: contactId },
      data,
    });
  }

  async deleteEmergencyContact(contactId: string): Promise<void> {
    await prisma.emergencyContact.delete({
      where: { id: contactId },
    });
  }

  // Issue Management
  async getIssues(coupleId: string): Promise<WeddingDayIssueWithDetails[]> {
    return prisma.weddingDayIssue.findMany({
      where: { coupleId: coupleId },
      include: {
        related_vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        related_event: {
          select: {
            id: true,
            event_name: true,
          },
        },
        reported_by: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { reported_at: 'desc' },
      ],
    });
  }

  async createIssue(
    coupleId: string,
    data: z.infer<typeof createIssueSchema>,
    reportedBy?: string
  ): Promise<WeddingDayIssue> {
    const validated = createIssueSchema.parse(data);
    
    return prisma.weddingDayIssue.create({
      data: {
        coupleId: coupleId,
        ...validated,
        reported_by: reportedBy,
      },
    });
  }

  async updateIssue(
    issueId: string,
    data: z.infer<typeof updateIssueSchema>
  ): Promise<WeddingDayIssue> {
    const validated = updateIssueSchema.parse(data);
    
    const updateData: any = { ...validated };
    
    // Auto-set timestamps based on status changes
    if (validated.status === 'acknowledged' && !updateData.acknowledged_at) {
      updateData.acknowledged_at = new Date();
    }
    
    if (validated.status === 'resolved' && !updateData.resolved_at) {
      updateData.resolved_at = new Date();
    }
    
    return prisma.weddingDayIssue.update({
      where: { id: issueId },
      data: updateData,
    });
  }

  // Guest Check-ins
  async checkInGuest(
    guestId: string,
    checkedInBy?: string,
    notes?: string
  ): Promise<GuestCheckIn> {
    return prisma.guestCheckIn.upsert({
      where: { guestId: guestId },
      update: {
        checked_in_at: new Date(),
        checked_in_by: checkedInBy,
        special_notes: notes,
      },
      create: {
        guestId: guestId,
        checked_in_by: checkedInBy,
        special_notes: notes,
      },
    });
  }

  async updateGuestCheckIn(
    guestId: string,
    data: Partial<GuestCheckIn>
  ): Promise<GuestCheckIn> {
    return prisma.guestCheckIn.update({
      where: { guestId: guestId },
      data,
    });
  }

  async getGuestCheckIns(coupleId: string): Promise<GuestCheckIn[]> {
    return prisma.guestCheckIn.findMany({
      where: {
        guest: {
          coupleId: coupleId,
          rsvp_status: 'attending',
        },
      },
      include: {
        guest: true,
      },
    });
  }

  // Weather Updates
  async recordWeatherUpdate(
    coupleId: string,
    data: z.infer<typeof weatherUpdateSchema>
  ): Promise<WeatherUpdate> {
    const validated = weatherUpdateSchema.parse(data);
    
    return prisma.weatherUpdate.create({
      data: {
        coupleId: coupleId,
        ...validated,
      },
    });
  }

  async getLatestWeather(coupleId: string): Promise<WeatherUpdate | null> {
    return prisma.weatherUpdate.findFirst({
      where: { coupleId: coupleId },
      orderBy: { recorded_at: 'desc' },
    });
  }

  async getWeatherHistory(coupleId: string, hours: number = 24): Promise<WeatherUpdate[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    return prisma.weatherUpdate.findMany({
      where: {
        coupleId: coupleId,
        recorded_at: { gte: since },
      },
      orderBy: { recorded_at: 'asc' },
    });
  }

  // Summary Methods
  private async getTimelineSummary(coupleId: string) {
    const events = await prisma.timelineEvent.findMany({
      where: { coupleId: coupleId },
      select: { status: true },
    });
    
    return {
      total_events: events.length,
      completed: events.filter(e => e.status === 'completed').length,
      in_progress: events.filter(e => e.status === 'in_progress').length,
      upcoming: events.filter(e => e.status === 'scheduled').length,
      delayed: events.filter(e => e.status === 'delayed').length,
    };
  }

  private async getVendorSummary(coupleId: string) {
    const vendors = await this.getVendorCheckIns(coupleId);
    
    return {
      total: vendors.length,
      checked_in: vendors.filter(v => v.status === 'checked_in' || v.status === 'setup_complete').length,
      setup_complete: vendors.filter(v => v.status === 'setup_complete').length,
      not_arrived: vendors.filter(v => v.status === 'not_arrived').length,
    };
  }

  private async getGuestSummary(coupleId: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(DISTINCT g.id) as total_expected,
        COUNT(DISTINCT gc.guestId) as checked_in,
        COUNT(DISTINCT CASE WHEN gc.table_confirmed THEN gc.guestId END) as table_confirmed,
        COUNT(DISTINCT CASE WHEN gc.meal_served THEN gc.guestId END) as meals_served
      FROM guests g
      LEFT JOIN guest_checkins gc ON g.id = gc.guestId
      WHERE g.coupleId = ${coupleId}::uuid AND g.rsvp_status = 'attending'
    `;
    
    return {
      total_expected: Number(result[0]?.total_expected || 0),
      checked_in: Number(result[0]?.checked_in || 0),
      table_confirmed: Number(result[0]?.table_confirmed || 0),
      meals_served: Number(result[0]?.meals_served || 0),
    };
  }

  private async getIssueSummary(coupleId: string) {
    const issues = await prisma.weddingDayIssue.findMany({
      where: { coupleId: coupleId },
      select: { status: true, priority: true },
    });
    
    return {
      total: issues.length,
      critical: issues.filter(i => i.priority === 'critical').length,
      high: issues.filter(i => i.priority === 'high').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      active: issues.filter(i => i.status !== 'resolved').length,
    };
  }

  // Real-time Update Methods (for WebSocket events)
  async broadcastTimelineUpdate(eventId: string, status: EventStatus) {
    // This will be implemented with Socket.io
    // For now, just return the updated event
    return this.updateTimelineEvent(eventId, { status });
  }

  async broadcastVendorUpdate(vendorId: string, status: VendorCheckInStatus) {
    // This will be implemented with Socket.io
    return this.updateVendorCheckIn(vendorId, { status });
  }

  async broadcastIssueUpdate(issueId: string, update: z.infer<typeof updateIssueSchema>) {
    // This will be implemented with Socket.io
    return this.updateIssue(issueId, update);
  }
}

// Cached service instance
export const dayOfDashboardService = cache(() => new DayOfDashboardService());