import { prisma } from '@/lib/prisma';
import { 
  DayOfTimeline,
  VendorCheckIn,
  GuestCheckIn,
  Issue,
  EmergencyContact,
  WeatherUpdate,
  EventStatus,
  IssuePriority,
  IssueCategory,
  Prisma
} from '@prisma/client';

export class DayOfDashboardService {
  async getTimeline(eventId: string) {
    return prisma.dayOfTimeline.findMany({
      where: { eventId },
      include: {
        vendor: true
      },
      orderBy: { scheduledTime: 'asc' }
    });
  }

  async createTimelineEvent(data: {
    eventId: string;
    title: string;
    description?: string;
    scheduledTime: Date;
    duration?: number;
    vendorId?: string;
    location?: string;
  }) {
    return prisma.dayOfTimeline.create({
      data: {
        eventId: data.eventId,
        title: data.title,
        description: data.description,
        scheduledTime: data.scheduledTime,
        duration: data.duration || 30,
        vendorId: data.vendorId,
        location: data.location,
        status: 'pending'
      }
    });
  }

  async updateTimelineStatus(
    timelineId: string, 
    status: EventStatus,
    actualTime?: Date
  ) {
    return prisma.dayOfTimeline.update({
      where: { id: timelineId },
      data: {
        status,
        actualTime
      }
    });
  }

  async getVendorCheckIns(coupleId: string) {
    return prisma.vendorCheckIn.findMany({
      where: {
        vendor: {
          coupleId
        }
      },
      include: {
        vendor: true
      },
      orderBy: { scheduledTime: 'asc' }
    });
  }

  async checkInVendor(
    vendorId: string,
    status: 'arrived' | 'late' | 'no_show',
    notes?: string
  ) {
    const existingCheckIn = await prisma.vendorCheckIn.findFirst({
      where: {
        vendorId,
        checkInTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    if (existingCheckIn) {
      return prisma.vendorCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          status,
          checkInTime: new Date(),
          notes
        }
      });
    }

    // Get vendor details for scheduled time
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });

    return prisma.vendorCheckIn.create({
      data: {
        vendorId,
        scheduledTime: new Date(), // Should be from vendor's scheduled time
        checkInTime: new Date(),
        status,
        notes
      }
    });
  }

  async getGuestCheckInStats(eventId: string) {
    const totalGuests = await prisma.guest.count({
      where: { eventId }
    });

    const checkedInGuests = await prisma.guestCheckIn.count({
      where: { 
        eventId,
        checkedIn: true
      }
    });

    const checkIns = await prisma.guestCheckIn.findMany({
      where: { eventId },
      include: {
        guest: true
      },
      orderBy: { checkInTime: 'desc' },
      take: 10 // Last 10 check-ins
    });

    return {
      total: totalGuests,
      checkedIn: checkedInGuests,
      remaining: totalGuests - checkedInGuests,
      percentage: totalGuests > 0 ? Math.round(((checkedInGuests / totalGuests) * 100) * 100) / 100 : 0,
      recentCheckIns: checkIns
    };
  }

  async checkInGuest(
    eventId: string,
    guestId: string,
    metadata?: {
      method?: string;
      location?: string;
      deviceId?: string;
      scannedBy?: string;
    }
  ) {
    const existingCheckIn = await prisma.guestCheckIn.findFirst({
      where: {
        eventId,
        guestId
      }
    });

    if (existingCheckIn) {
      return prisma.guestCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          checkedIn: true,
          checkInTime: new Date(),
          checkInMethod: metadata?.method,
          notes: JSON.stringify(metadata)
        }
      });
    }

    return prisma.guestCheckIn.create({
      data: {
        eventId,
        guestId,
        checkedIn: true,
        checkInTime: new Date(),
        checkInMethod: metadata?.method || 'manual',
        notes: metadata ? JSON.stringify(metadata) : null
      }
    });
  }

  async searchGuests(eventId: string, query: string) {
    return prisma.guest.findMany({
      where: {
        eventId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } }
        ]
      },
      include: {
        checkIns: true,
        seatingAssignments: {
          include: {
            table: true
          }
        }
      },
      take: 20
    });
  }

  async getGuestCheckInStatus(eventId: string, guestId: string) {
    const checkIn = await prisma.guestCheckIn.findFirst({
      where: {
        eventId,
        guestId
      },
      include: {
        guest: true
      }
    });

    return checkIn;
  }

  async getGuestDetails(guestId: string) {
    return prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        seatingAssignments: {
          include: {
            table: true
          }
        },
        checkIns: true
      }
    });
  }

  async getIssues(coupleId: string) {
    return prisma.issue.findMany({
      where: { coupleId },
      include: {
        reportedBy: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async reportIssue(data: {
    coupleId: string;
    title: string;
    description?: string;
    category: IssueCategory;
    priority: IssuePriority;
    reportedById: string;
  }) {
    return prisma.issue.create({
      data: {
        coupleId: data.coupleId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        reportedById: data.reportedById,
        status: 'open'
      }
    });
  }

  async updateIssue(
    issueId: string,
    data: Partial<{
      status: 'open' | 'in_progress' | 'resolved';
      priority: IssuePriority;
      assignedToId: string;
      notes: string;
    }>
  ) {
    const updateData: any = { ...data };
    
    if (data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    return prisma.issue.update({
      where: { id: issueId },
      data: updateData
    });
  }

  async getEmergencyContacts(coupleId: string) {
    return prisma.emergencyContact.findMany({
      where: { coupleId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  }

  async addEmergencyContact(data: {
    coupleId: string;
    name: string;
    relationship?: string;
    phone: string;
    isPrimary: boolean;
  }) {
    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: {
          coupleId: data.coupleId,
          isPrimary: true
        },
        data: { isPrimary: false }
      });
    }

    return prisma.emergencyContact.create({
      data
    });
  }

  async deleteEmergencyContact(contactId: string) {
    return prisma.emergencyContact.delete({
      where: { id: contactId }
    });
  }

  async updateWeather(eventId: string, weatherData: any) {
    const existingUpdate = await prisma.weatherUpdate.findFirst({
      where: {
        eventId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });

    if (existingUpdate) {
      return prisma.weatherUpdate.update({
        where: { id: existingUpdate.id },
        data: { data: weatherData }
      });
    }

    return prisma.weatherUpdate.create({
      data: {
        eventId,
        data: weatherData
      }
    });
  }

  async getWeatherUpdates(eventId: string, limit: number = 10) {
    return prisma.weatherUpdate.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async getDashboardSummary(eventId: string, coupleId: string) {
    const [
      timeline,
      vendorCheckIns,
      guestStats,
      openIssues,
      weather
    ] = await Promise.all([
      this.getTimeline(eventId),
      this.getVendorCheckIns(coupleId),
      this.getGuestCheckInStats(eventId),
      prisma.issue.count({
        where: {
          coupleId,
          status: { not: 'resolved' }
        }
      }),
      this.getWeatherUpdates(eventId, 1)
    ]);

    return {
      timeline: {
        total: timeline.length,
        completed: timeline.filter(t => t.status === 'completed').length,
        inProgress: timeline.filter(t => t.status === 'in_progress').length,
        upcoming: timeline.filter(t => t.status === 'pending').length
      },
      vendors: {
        total: vendorCheckIns.length,
        arrived: vendorCheckIns.filter(v => v.status === 'arrived').length,
        late: vendorCheckIns.filter(v => v.status === 'late').length,
        noShow: vendorCheckIns.filter(v => v.status === 'no_show').length
      },
      guests: guestStats,
      issues: {
        open: openIssues
      },
      weather: weather[0]?.data || null
    };
  }
}

// Export singleton instance
export const dayOfDashboardService = () => new DayOfDashboardService();