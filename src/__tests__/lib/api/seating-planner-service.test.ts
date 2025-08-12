import { SeatingPlannerService } from '@/lib/api/seating-planner';
import { prisma } from '@/lib/prisma';
import { TableShape, SeatingPreferenceType } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    seatingLayout: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    table: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn()
    },
    seatingAssignment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn()
    },
    seatingPreference: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    guest: {
      findMany: jest.fn()
    },
    event: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

describe('SeatingPlannerService', () => {
  let service: SeatingPlannerService;

  beforeEach(() => {
    service = new SeatingPlannerService();
    jest.clearAllMocks();
  });

  describe('createLayout', () => {
    it('should create a new seating layout', async () => {
      const mockLayout = {
        id: 'layout-123',
        name: 'Main Reception',
        eventId: 'event-123',
        venueLayout: {},
        notes: 'Main reception layout',
        isActive: true
      };

      (prisma.seatingLayout.create as jest.Mock).mockResolvedValue(mockLayout);

      const result = await service.createLayout({
        name: 'Main Reception',
        eventId: 'event-123',
        notes: 'Main reception layout'
      });

      expect(prisma.seatingLayout.create).toHaveBeenCalledWith({
        data: {
          name: 'Main Reception',
          eventId: 'event-123',
          venueLayout: {},
          notes: 'Main reception layout',
          isActive: true
        }
      });
      expect(result).toEqual(mockLayout);
    });
  });

  describe('getLayouts', () => {
    it('should get all layouts for an event', async () => {
      const mockLayouts = [
        {
          id: 'layout-1',
          name: 'Layout 1',
          tables: [{ _count: { assignments: 5 } }]
        },
        {
          id: 'layout-2',
          name: 'Layout 2',
          tables: [{ _count: { assignments: 8 } }]
        }
      ];

      (prisma.seatingLayout.findMany as jest.Mock).mockResolvedValue(mockLayouts);

      const result = await service.getLayouts('event-123');

      expect(prisma.seatingLayout.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-123' },
        include: {
          tables: {
            include: {
              _count: {
                select: { assignments: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(mockLayouts);
    });
  });

  describe('assignGuestToTable', () => {
    it('should create new assignment when guest not already assigned', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        tableId: 'table-123',
        guestId: 'guest-123',
        seatNumber: 1
      };

      (prisma.seatingAssignment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ layoutId: 'layout-123' });
      (prisma.seatingAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);

      const result = await service.assignGuestToTable({
        tableId: 'table-123',
        guestId: 'guest-123',
        seatNumber: 1
      });

      expect(prisma.seatingAssignment.create).toHaveBeenCalledWith({
        data: {
          tableId: 'table-123',
          guestId: 'guest-123',
          seatNumber: 1
        }
      });
      expect(result).toEqual(mockAssignment);
    });

    it('should update existing assignment when guest already assigned', async () => {
      const existingAssignment = {
        id: 'assignment-existing',
        tableId: 'table-old',
        guestId: 'guest-123',
        seatNumber: 5
      };

      const updatedAssignment = {
        id: 'assignment-existing',
        tableId: 'table-123',
        guestId: 'guest-123',
        seatNumber: 1
      };

      (prisma.seatingAssignment.findFirst as jest.Mock).mockResolvedValue(existingAssignment);
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ layoutId: 'layout-123' });
      (prisma.seatingAssignment.update as jest.Mock).mockResolvedValue(updatedAssignment);

      const result = await service.assignGuestToTable({
        tableId: 'table-123',
        guestId: 'guest-123',
        seatNumber: 1
      });

      expect(prisma.seatingAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-existing' },
        data: {
          tableId: 'table-123',
          seatNumber: 1
        }
      });
      expect(result).toEqual(updatedAssignment);
    });
  });

  describe('deleteLayout', () => {
    it('should delete layout and all related data in transaction', async () => {
      const mockTransactionResult = [
        { count: 10 }, // assignments deleted
        { count: 5 },  // preferences deleted
        { count: 8 },  // tables deleted
        { id: 'layout-123' } // layout deleted
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue(mockTransactionResult);

      await service.deleteLayout('layout-123');

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.seatingAssignment.deleteMany({
          where: { table: { layoutId: 'layout-123' } }
        }),
        prisma.seatingPreference.deleteMany({
          where: { layoutId: 'layout-123' }
        }),
        prisma.table.deleteMany({
          where: { layoutId: 'layout-123' }
        }),
        prisma.seatingLayout.delete({
          where: { id: 'layout-123' }
        })
      ]);
    });
  });

  describe('saveOptimizedAssignments', () => {
    it('should replace all assignments with optimized ones', async () => {
      const optimizedAssignments = [
        { guestId: 'g1', tableId: 't1', seatNumber: 1 },
        { guestId: 'g2', tableId: 't1', seatNumber: 2 },
        { guestId: 'g3', tableId: 't2', seatNumber: 1 }
      ];

      (prisma.seatingAssignment.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.seatingAssignment.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.saveOptimizedAssignments('layout-123', optimizedAssignments);

      expect(prisma.seatingAssignment.deleteMany).toHaveBeenCalledWith({
        where: { table: { layoutId: 'layout-123' } }
      });

      expect(prisma.seatingAssignment.createMany).toHaveBeenCalledWith({
        data: optimizedAssignments
      });
    });
  });

  describe('duplicateLayout', () => {
    it('should create a complete copy of layout with new name', async () => {
      const originalLayout = {
        id: 'layout-original',
        name: 'Original Layout',
        eventId: 'event-123',
        venueLayout: { zoom: 1 },
        notes: 'Original notes',
        tables: [
          {
            id: 'table-1',
            name: 'Table 1',
            capacity: 8,
            shape: TableShape.round,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 0,
            assignments: [
              { guestId: 'g1', seatNumber: 1 },
              { guestId: 'g2', seatNumber: 2 }
            ]
          }
        ],
        preferences: [
          {
            id: 'pref-1',
            guestId1: 'g1',
            guestId2: 'g2',
            preferenceType: SeatingPreferenceType.must_sit_together,
            priority: 10,
            notes: 'Best friends'
          }
        ]
      };

      const newLayout = {
        id: 'layout-new',
        name: 'Copy of Original Layout'
      };

      const newTable = {
        id: 'table-new-1',
        name: 'Table 1'
      };

      jest.spyOn(service, 'getLayoutWithDetails').mockResolvedValue(originalLayout as any);
      (prisma.seatingLayout.create as jest.Mock).mockResolvedValue(newLayout);
      (prisma.table.create as jest.Mock).mockResolvedValue(newTable);
      (prisma.seatingAssignment.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.seatingPreference.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.duplicateLayout('layout-original', 'Copy of Original Layout');

      expect(prisma.seatingLayout.create).toHaveBeenCalledWith({
        data: {
          name: 'Copy of Original Layout',
          eventId: 'event-123',
          venueLayout: { zoom: 1 },
          notes: 'Original notes',
          isActive: true
        }
      });

      expect(prisma.table.create).toHaveBeenCalled();
      expect(prisma.seatingAssignment.createMany).toHaveBeenCalled();
      expect(prisma.seatingPreference.createMany).toHaveBeenCalled();
      expect(result).toEqual(newLayout);
    });
  });
});