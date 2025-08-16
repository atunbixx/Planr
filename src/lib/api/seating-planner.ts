import { prisma } from '@/lib/prisma';
import { 
  SeatingLayout, 
  Table, 
  SeatingAssignment, 
  SeatingPreference,
  TableShape,
  SeatingPreferenceType,
  Prisma
} from '@prisma/client';

export class SeatingPlannerService {
  async createLayout(data: {
    name: string;
    eventId: string;
    venueLayout?: any;
    notes?: string;
  }) {
    return prisma.seatingLayout.create({
      data: {
        name: data.name,
        eventId: data.eventId,
        venueLayout: data.venueLayout || {},
        notes: data.notes,
        isActive: true
      }
    });
  }

  async getLayouts(eventId: string) {
    return prisma.seatingLayout.findMany({
      where: { eventId },
      include: {
        tables: {
          include: {
            _count: {
              select: { assignments: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' as const }
    });
  }

  async getLayoutWithDetails(layoutId: string) {
    return prisma.seatingLayout.findUnique({
      where: { id: layoutId },
      include: {
        tables: {
          include: {
            assignments: {
              include: {
                guest: true
              }
            }
          }
        },
        preferences: {
          include: {
            guest1: true,
            guest2: true
          }
        },
        event: {
          include: {
            guests: true
          }
        }
      }
    });
  }

  async updateLayout(layoutId: string, data: Partial<{
    name: string;
    venueLayout: any;
    notes: string;
    isActive: boolean;
  }>) {
    return prisma.seatingLayout.update({
      where: { id: layoutId },
      data
    });
  }

  async deleteLayout(layoutId: string) {
    // Use transaction to delete all related data
    return prisma.$transaction([
      prisma.seatingAssignment.deleteMany({
        where: { table: { layoutId } }
      }),
      prisma.seatingPreference.deleteMany({
        where: { layoutId }
      }),
      prisma.table.deleteMany({
        where: { layoutId }
      }),
      prisma.seatingLayout.delete({
        where: { id: layoutId }
      })
    ]);
  }

  async createTable(data: {
    layoutId: string;
    name: string;
    capacity: number;
    shape: TableShape;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
  }) {
    return prisma.table.create({
      data: {
        layoutId: data.layoutId,
        name: data.name,
        capacity: data.capacity,
        shape: data.shape,
        x: data.x,
        y: data.y,
        width: data.width || 100,
        height: data.height || 100,
        rotation: data.rotation || 0
      }
    });
  }

  async getTables(layoutId: string) {
    return prisma.table.findMany({
      where: { layoutId },
      include: {
        assignments: {
          include: {
            guest: true
          }
        }
      },
      orderBy: { name: 'asc' as const }
    });
  }

  async updateTable(tableId: string, data: Partial<{
    name: string;
    capacity: number;
    shape: TableShape;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }>) {
    return prisma.table.update({
      where: { id: tableId },
      data
    });
  }

  async deleteTable(tableId: string) {
    // Delete assignments first, then the table
    return prisma.$transaction([
      prisma.seatingAssignment.deleteMany({
        where: { tableId }
      }),
      prisma.table.delete({
        where: { id: tableId }
      })
    ]);
  }

  async assignGuestToTable(data: {
    tableId: string;
    guestId: string;
    seatNumber?: number;
  }) {
    // Check if guest is already assigned
    const existingAssignment = await prisma.seatingAssignment.findFirst({
      where: {
        guestId: data.guestId,
        table: {
          layoutId: (await prisma.table.findUnique({
            where: { id: data.tableId },
            select: { layoutId: true }
          }))?.layoutId
        }
      }
    });

    if (existingAssignment) {
      // Update existing assignment
      return prisma.seatingAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          tableId: data.tableId,
          seatNumber: data.seatNumber
        }
      });
    }

    // Create new assignment
    return prisma.seatingAssignment.create({
      data: {
        tableId: data.tableId,
        guestId: data.guestId,
        seatNumber: data.seatNumber || 1
      }
    });
  }

  async removeGuestFromTable(assignmentId: string) {
    return prisma.seatingAssignment.delete({
      where: { id: assignmentId }
    });
  }

  async getAssignments(layoutId: string) {
    return prisma.seatingAssignment.findMany({
      where: {
        table: { layoutId }
      },
      include: {
        guest: true,
        table: true
      }
    });
  }

  async createSeatingPreference(data: {
    layoutId: string;
    guestId1?: string;
    guestId2?: string;
    preferenceType: SeatingPreferenceType;
    notes?: string;
    priority?: number;
  }) {
    return prisma.seatingPreference.create({
      data: {
        layoutId: data.layoutId,
        guestId1: data.guestId1,
        guestId2: data.guestId2,
        preferenceType: data.preferenceType,
        notes: data.notes,
        priority: data.priority || 1
      }
    });
  }

  async getSeatingPreferences(layoutId: string) {
    return prisma.seatingPreference.findMany({
      where: { layoutId },
      include: {
        guest1: true,
        guest2: true
      },
      orderBy: { priority: 'desc' }
    });
  }

  async updateSeatingPreference(
    preferenceId: string, 
    data: Partial<{
      preferenceType: SeatingPreferenceType;
      notes: string;
      priority: number;
    }>
  ) {
    return prisma.seatingPreference.update({
      where: { id: preferenceId },
      data
    });
  }

  async deleteSeatingPreference(preferenceId: string) {
    return prisma.seatingPreference.delete({
      where: { id: preferenceId }
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
        }
      },
      orderBy: { name: 'asc' as const }
    });
  }

  async getEventDetails(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true
      }
    });
  }

  async saveOptimizedAssignments(layoutId: string, assignments: Array<{
    guestId: string;
    tableId: string;
    seatNumber: number;
  }>) {
    // Delete existing assignments for this layout
    await prisma.seatingAssignment.deleteMany({
      where: {
        table: { layoutId }
      }
    });

    // Create new optimized assignments
    return prisma.seatingAssignment.createMany({
      data: assignments.map(a => ({
        tableId: a.tableId,
        guestId: a.guestId,
        seatNumber: a.seatNumber
      }))
    });
  }

  async duplicateLayout(layoutId: string, newName: string) {
    const original = await this.getLayoutWithDetails(layoutId);
    if (!original) throw new Error('Layout not found');

    // Create new layout
    const newLayout = await prisma.seatingLayout.create({
      data: {
        name: newName,
        eventId: original.eventId,
        venueLayout: original.venueLayout,
        notes: original.notes,
        isActive: true
      }
    });

    // Create tables
    const tableMapping = new Map<string, string>();
    for (const table of original.tables) {
      const newTable = await prisma.table.create({
        data: {
          layoutId: newLayout.id,
          name: table.name,
          capacity: table.capacity,
          shape: table.shape,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          rotation: table.rotation
        }
      });
      tableMapping.set(table.id, newTable.id);
    }

    // Create assignments
    for (const table of original.tables) {
      const newTableId = tableMapping.get(table.id);
      if (newTableId && table.assignments.length > 0) {
        await prisma.seatingAssignment.createMany({
          data: table.assignments.map(a => ({
            tableId: newTableId,
            guestId: a.guestId,
            seatNumber: a.seatNumber
          }))
        });
      }
    }

    // Create preferences
    if (original.preferences.length > 0) {
      await prisma.seatingPreference.createMany({
        data: original.preferences.map(p => ({
          layoutId: newLayout.id,
          guestId1: p.guestId1,
          guestId2: p.guestId2,
          preferenceType: p.preferenceType,
          notes: p.notes,
          priority: p.priority
        }))
      });
    }

    return newLayout;
  }
}

// Export singleton instance
export const seatingPlannerService = () => new SeatingPlannerService();