import { prisma } from '@/lib/prisma';
import { Guest, Prisma } from '@prisma/client';

export class GuestService {
  async getGuestsByIds(guestIds: string[]) {
    return prisma.guest.findMany({
      where: {
        id: {
          in: guestIds
        }
      },
      include: {
        seatingAssignments: {
          include: {
            table: true
          }
        }
      }
    });
  }

  async getEventGuests(eventId: string) {
    return prisma.guest.findMany({
      where: { eventId },
      include: {
        seatingAssignments: {
          include: {
            table: true
          }
        },
        checkIns: true
      },
      orderBy: { name: 'asc' as const }
    });
  }

  async createGuest(data: {
    eventId: string;
    name: string;
    email?: string;
    phone?: string;
    rsvpStatus?: string;
    plusOne?: boolean;
    dietaryRestrictions?: string;
    notes?: string;
  }) {
    return prisma.guest.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        rsvpStatus: data.rsvpStatus || 'pending',
        plusOne: data.plusOne || false,
        dietaryRestrictions: data.dietaryRestrictions,
        notes: data.notes
      }
    });
  }

  async updateGuest(guestId: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    rsvpStatus: string;
    plusOne: boolean;
    dietaryRestrictions: string;
    notes: string;
  }>) {
    return prisma.guest.update({
      where: { id: guestId },
      data
    });
  }

  async deleteGuest(guestId: string) {
    // Delete related data first
    return prisma.$transaction([
      prisma.seatingAssignment.deleteMany({
        where: { guestId }
      }),
      prisma.guestCheckIn.deleteMany({
        where: { guestId }
      }),
      prisma.seatingPreference.deleteMany({
        where: {
          OR: [
            { guestId1: guestId },
            { guestId2: guestId }
          ]
        }
      }),
      prisma.guest.delete({
        where: { id: guestId }
      })
    ]);
  }

  async getGuestStats(eventId: string) {
    const [
      total,
      confirmed,
      declined,
      pending,
      plusOnes
    ] = await Promise.all([
      prisma.guest.count({ where: { eventId } }),
      prisma.guest.count({ where: { eventId, rsvpStatus: 'confirmed' } }),
      prisma.guest.count({ where: { eventId, rsvpStatus: 'declined' } }),
      prisma.guest.count({ where: { eventId, rsvpStatus: 'pending' } }),
      prisma.guest.count({ where: { eventId, plusOne: true, rsvpStatus: 'confirmed' } })
    ]);

    return {
      total,
      confirmed,
      declined,
      pending,
      plusOnes,
      expectedAttendance: confirmed + plusOnes
    };
  }

  async importGuests(eventId: string, guests: Array<{
    name: string;
    email?: string;
    phone?: string;
    rsvpStatus?: string;
    plusOne?: boolean;
    dietaryRestrictions?: string;
    notes?: string;
  }>) {
    return prisma.guest.createMany({
      data: guests.map(guest => ({
        ...guest,
        eventId,
        rsvpStatus: guest.rsvpStatus || 'pending',
        plusOne: guest.plusOne || false
      }))
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
      take: 20
    });
  }
}

// Export singleton instance
export const guestService = () => new GuestService();