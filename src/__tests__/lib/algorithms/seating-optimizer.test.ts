import { GeneticSeatingOptimizer } from '@/lib/algorithms/seating-optimizer';

describe('GeneticSeatingOptimizer', () => {
  let optimizer: GeneticSeatingOptimizer;

  beforeEach(() => {
    optimizer = new GeneticSeatingOptimizer({
      populationSize: 50,
      maxGenerations: 100,
      mutationRate: 0.05,
      eliteSize: 5,
      tournamentSize: 3,
      crossoverRate: 0.8,
      targetFitness: 0.95,
      maxStagnation: 10
    });
  });

  describe('optimize', () => {
    it('should optimize seating arrangement for simple case', async () => {
      const guests = [
        { id: 'g1', name: 'Alice', eventId: 'e1' },
        { id: 'g2', name: 'Bob', eventId: 'e1' },
        { id: 'g3', name: 'Charlie', eventId: 'e1' },
        { id: 'g4', name: 'David', eventId: 'e1' }
      ];

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 2, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 },
        { id: 't2', name: 'Table 2', capacity: 2, layoutId: 'l1', shape: 'round' as const, x: 100, y: 0 }
      ];

      const preferences = [
        {
          id: 'p1',
          layoutId: 'l1',
          guestId1: 'g1',
          guestId2: 'g2',
          preferenceType: 'must_sit_together' as const,
          priority: 10
        }
      ];

      const result = await optimizer.optimize(guests, tables, preferences);

      expect(result.solution).toBeDefined();
      expect(result.solution).toHaveLength(guests.length);
      expect(result.fitness).toBeGreaterThan(0);
      expect(result.generations).toBeGreaterThan(0);

      // Check that preferences are respected
      const g1Assignment = result.solution.find(a => a.guestId === 'g1');
      const g2Assignment = result.solution.find(a => a.guestId === 'g2');
      expect(g1Assignment?.tableId).toBe(g2Assignment?.tableId);
    });

    it('should handle cannot sit together preferences', async () => {
      const guests = [
        { id: 'g1', name: 'Alice', eventId: 'e1' },
        { id: 'g2', name: 'Bob', eventId: 'e1' }
      ];

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 2, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 },
        { id: 't2', name: 'Table 2', capacity: 2, layoutId: 'l1', shape: 'round' as const, x: 100, y: 0 }
      ];

      const preferences = [
        {
          id: 'p1',
          layoutId: 'l1',
          guestId1: 'g1',
          guestId2: 'g2',
          preferenceType: 'cannot_sit_together' as const,
          priority: 10
        }
      ];

      const result = await optimizer.optimize(guests, tables, preferences);

      const g1Assignment = result.solution.find(a => a.guestId === 'g1');
      const g2Assignment = result.solution.find(a => a.guestId === 'g2');
      expect(g1Assignment?.tableId).not.toBe(g2Assignment?.tableId);
    });

    it('should respect table capacity constraints', async () => {
      const guests = Array.from({ length: 10 }, (_, i) => ({
        id: `g${i}`,
        name: `Guest ${i}`,
        eventId: 'e1'
      }));

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 4, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 },
        { id: 't2', name: 'Table 2', capacity: 4, layoutId: 'l1', shape: 'round' as const, x: 100, y: 0 },
        { id: 't3', name: 'Table 3', capacity: 4, layoutId: 'l1', shape: 'round' as const, x: 200, y: 0 }
      ];

      const result = await optimizer.optimize(guests, tables, []);

      // Count guests per table
      const tableCounts = new Map<string, number>();
      result.solution.forEach(assignment => {
        const count = tableCounts.get(assignment.tableId) || 0;
        tableCounts.set(assignment.tableId, count + 1);
      });

      // Verify no table is over capacity
      tables.forEach(table => {
        const count = tableCounts.get(table.id) || 0;
        expect(count).toBeLessThanOrEqual(table.capacity);
      });

      // Verify all guests are assigned
      expect(result.solution).toHaveLength(guests.length);
    });

    it('should terminate early when target fitness is reached', async () => {
      const optimizer = new GeneticSeatingOptimizer({
        populationSize: 20,
        maxGenerations: 1000,
        mutationRate: 0.05,
        targetFitness: 0.5, // Low target for quick termination
        maxStagnation: 50
      });

      const guests = [
        { id: 'g1', name: 'Alice', eventId: 'e1' },
        { id: 'g2', name: 'Bob', eventId: 'e1' }
      ];

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 10, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 }
      ];

      const result = await optimizer.optimize(guests, tables, []);

      expect(result.generations).toBeLessThan(1000);
      expect(result.fitness).toBeGreaterThanOrEqual(0.5);
    });

    it('should track convergence history', async () => {
      const guests = Array.from({ length: 6 }, (_, i) => ({
        id: `g${i}`,
        name: `Guest ${i}`,
        eventId: 'e1'
      }));

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 3, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 },
        { id: 't2', name: 'Table 2', capacity: 3, layoutId: 'l1', shape: 'round' as const, x: 100, y: 0 }
      ];

      const result = await optimizer.optimize(guests, tables, []);

      expect(result.convergenceHistory).toBeDefined();
      expect(result.convergenceHistory.length).toBeGreaterThan(0);
      
      // Verify history is in ascending order (fitness improves over time)
      for (let i = 1; i < result.convergenceHistory.length; i++) {
        expect(result.convergenceHistory[i].bestFitness)
          .toBeGreaterThanOrEqual(result.convergenceHistory[i - 1].bestFitness);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty guest list', async () => {
      const tables = [
        { id: 't1', name: 'Table 1', capacity: 4, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 }
      ];

      const result = await optimizer.optimize([], tables, []);

      expect(result.solution).toEqual([]);
      expect(result.fitness).toBe(1); // Perfect fitness for no guests
    });

    it('should handle more guests than capacity', async () => {
      const guests = Array.from({ length: 10 }, (_, i) => ({
        id: `g${i}`,
        name: `Guest ${i}`,
        eventId: 'e1'
      }));

      const tables = [
        { id: 't1', name: 'Table 1', capacity: 2, layoutId: 'l1', shape: 'round' as const, x: 0, y: 0 }
      ];

      await expect(optimizer.optimize(guests, tables, [])).rejects.toThrow();
    });
  });
});