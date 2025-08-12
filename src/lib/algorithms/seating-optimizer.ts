import { Guest, Table, SeatingAssignment, SeatingPreference, SeatingPreferenceType } from '@prisma/client';

interface SeatingPlan {
  assignments: Map<string, string>; // guestId -> tableId
  fitness: number;
}

interface OptimizationCriteria {
  // Relationship-based
  prioritizeFamilyGroups: boolean;
  mixGuestSides: boolean; // Mix bride/groom sides
  
  // Preference-based
  respectAllConstraints: boolean;
  prioritizeAccessibility: boolean;
  
  // Social dynamics
  balanceTableAges: boolean;
  avoidIsolatedGuests: boolean;
  
  // Table utilization
  minimizeEmptySeats: boolean;
  preferEvenDistribution: boolean;
}

interface GuestWithRelations extends Guest {
  relationships?: {
    relatedGuestId: string;
    relationshipType: 'family' | 'friend' | 'colleague' | 'plus_one';
  }[];
}

interface TableWithCapacity extends Table {
  currentGuests: string[];
}

interface ConstraintViolation {
  type: 'hard' | 'soft';
  message: string;
  guestIds: string[];
  severity: number; // 0-100
}

export class GeneticSeatingOptimizer {
  private readonly POPULATION_SIZE = 100;
  private readonly MAX_GENERATIONS = 200;
  private readonly MUTATION_RATE = 0.05;
  private readonly ELITE_SIZE = 10;
  private readonly CONVERGENCE_THRESHOLD = 0.95;
  
  // Fitness weights
  private readonly WEIGHTS = {
    HARD_CONSTRAINT_VIOLATION: -1000,
    SOFT_CONSTRAINT_VIOLATION: -50,
    EMPTY_SEAT: -10,
    UNEVEN_DISTRIBUTION: -20,
    SAME_GROUP_BONUS: 20,
    MIXED_SIDES_BONUS: 15,
    AGE_BALANCE_BONUS: 10,
    ACCESSIBILITY_BONUS: 30,
  };

  constructor(
    private guests: GuestWithRelations[],
    private tables: TableWithCapacity[],
    private preferences: SeatingPreference[],
    private criteria: OptimizationCriteria
  ) {}

  /**
   * Main optimization function using genetic algorithm
   */
  async optimize(): Promise<SeatingPlan> {
    // Step 1: Validate input
    if (!this.canAccommodateAllGuests()) {
      throw new Error('Not enough table capacity for all guests');
    }

    // Step 2: Build constraint graph
    const constraints = this.buildConstraintGraph();
    
    // Step 3: Group guests by relationships
    const guestGroups = this.identifyGuestGroups();
    
    // Step 4: Generate initial population
    let population = this.generateInitialPopulation();
    
    // Step 5: Evolution loop
    let bestFitness = -Infinity;
    let stagnationCount = 0;
    
    for (let generation = 0; generation < this.MAX_GENERATIONS; generation++) {
      // Evaluate fitness
      const evaluatedPopulation = population.map(plan => ({
        plan,
        fitness: this.calculateFitness(plan, constraints),
      }));
      
      // Sort by fitness
      evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);
      
      // Check for convergence
      const currentBest = evaluatedPopulation[0].fitness;
      if (currentBest > bestFitness) {
        bestFitness = currentBest;
        stagnationCount = 0;
      } else {
        stagnationCount++;
      }
      
      if (stagnationCount > 20 || currentBest / bestFitness > this.CONVERGENCE_THRESHOLD) {
        console.log(`Converged at generation ${generation}`);
        break;
      }
      
      // Select parents and create new generation
      const parents = this.selectParents(evaluatedPopulation);
      const offspring = this.createOffspring(parents);
      
      // Combine elite and offspring
      population = [
        ...evaluatedPopulation.slice(0, this.ELITE_SIZE).map(e => e.plan),
        ...offspring,
      ].slice(0, this.POPULATION_SIZE);
    }
    
    // Return best solution
    const finalEvaluation = population.map(plan => ({
      plan,
      fitness: this.calculateFitness(plan, constraints),
    }));
    finalEvaluation.sort((a, b) => b.fitness - a.fitness);
    
    return finalEvaluation[0].plan;
  }

  /**
   * Calculate fitness score for a seating plan
   */
  private calculateFitness(plan: SeatingPlan, constraints: Map<string, ConstraintViolation[]>): number {
    let score = 1000; // Base score
    
    // Penalty for constraint violations
    const violations = this.checkConstraintViolations(plan);
    violations.forEach(violation => {
      if (violation.type === 'hard') {
        score += this.WEIGHTS.HARD_CONSTRAINT_VIOLATION * violation.severity / 100;
      } else {
        score += this.WEIGHTS.SOFT_CONSTRAINT_VIOLATION * violation.severity / 100;
      }
    });
    
    // Penalty for empty seats
    if (this.criteria.minimizeEmptySeats) {
      const emptySeats = this.calculateEmptySeats(plan);
      score += this.WEIGHTS.EMPTY_SEAT * emptySeats;
    }
    
    // Penalty for uneven distribution
    if (this.criteria.preferEvenDistribution) {
      const unevenness = this.calculateDistributionUnevenness(plan);
      score += this.WEIGHTS.UNEVEN_DISTRIBUTION * unevenness;
    }
    
    // Bonus for keeping groups together
    if (this.criteria.prioritizeFamilyGroups) {
      const groupBonus = this.calculateGroupCohesion(plan);
      score += this.WEIGHTS.SAME_GROUP_BONUS * groupBonus;
    }
    
    // Bonus for mixing guest sides
    if (this.criteria.mixGuestSides) {
      const mixingBonus = this.calculateSideMixing(plan);
      score += this.WEIGHTS.MIXED_SIDES_BONUS * mixingBonus;
    }
    
    // Bonus for age balance
    if (this.criteria.balanceTableAges) {
      const ageBalance = this.calculateAgeBalance(plan);
      score += this.WEIGHTS.AGE_BALANCE_BONUS * ageBalance;
    }
    
    // Bonus for accessibility compliance
    if (this.criteria.prioritizeAccessibility) {
      const accessibilityScore = this.calculateAccessibilityScore(plan);
      score += this.WEIGHTS.ACCESSIBILITY_BONUS * accessibilityScore;
    }
    
    return Math.max(0, score);
  }

  /**
   * Generate initial population of seating plans
   */
  private generateInitialPopulation(): SeatingPlan[] {
    const population: SeatingPlan[] = [];
    
    for (let i = 0; i < this.POPULATION_SIZE; i++) {
      if (i < this.POPULATION_SIZE * 0.2) {
        // 20% using smart initialization
        population.push(this.generateSmartPlan());
      } else {
        // 80% random initialization
        population.push(this.generateRandomPlan());
      }
    }
    
    return population;
  }

  /**
   * Generate a random seating plan
   */
  private generateRandomPlan(): SeatingPlan {
    const assignments = new Map<string, string>();
    const availableSeats = new Map<string, number>();
    
    // Initialize available seats
    this.tables.forEach(table => {
      availableSeats.set(table.id, table.capacity);
    });
    
    // Randomly assign guests
    const shuffledGuests = [...this.guests].sort(() => Math.random() - 0.5);
    
    for (const guest of shuffledGuests) {
      const availableTables = Array.from(availableSeats.entries())
        .filter(([_, seats]) => seats > 0)
        .map(([tableId, _]) => tableId);
      
      if (availableTables.length === 0) {
        console.error('No available seats for guest:', guest.name);
        continue;
      }
      
      const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
      assignments.set(guest.id, randomTable);
      availableSeats.set(randomTable, availableSeats.get(randomTable)! - 1);
    }
    
    return { assignments, fitness: 0 };
  }

  /**
   * Generate a smart seating plan using heuristics
   */
  private generateSmartPlan(): SeatingPlan {
    const assignments = new Map<string, string>();
    const tableOccupancy = new Map<string, string[]>();
    
    // Initialize table occupancy
    this.tables.forEach(table => {
      tableOccupancy.set(table.id, []);
    });
    
    // Group guests by family/group
    const groups = this.identifyGuestGroups();
    
    // Assign groups to tables
    groups.forEach(group => {
      const bestTable = this.findBestTableForGroup(group, tableOccupancy);
      if (bestTable) {
        group.forEach(guestId => {
          assignments.set(guestId, bestTable);
          tableOccupancy.get(bestTable)!.push(guestId);
        });
      }
    });
    
    // Assign remaining guests
    const assignedGuests = new Set(assignments.keys());
    const unassignedGuests = this.guests.filter(g => !assignedGuests.has(g.id));
    
    for (const guest of unassignedGuests) {
      const bestTable = this.findBestTableForGuest(guest.id, tableOccupancy);
      if (bestTable) {
        assignments.set(guest.id, bestTable);
        tableOccupancy.get(bestTable)!.push(guest.id);
      }
    }
    
    return { assignments, fitness: 0 };
  }

  /**
   * Select parents for breeding using tournament selection
   */
  private selectParents(evaluatedPopulation: { plan: SeatingPlan; fitness: number }[]): SeatingPlan[] {
    const parents: SeatingPlan[] = [];
    const tournamentSize = 5;
    
    while (parents.length < this.POPULATION_SIZE - this.ELITE_SIZE) {
      const tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        const randomIndex = Math.floor(Math.random() * evaluatedPopulation.length);
        tournament.push(evaluatedPopulation[randomIndex]);
      }
      
      tournament.sort((a, b) => b.fitness - a.fitness);
      parents.push(tournament[0].plan);
    }
    
    return parents;
  }

  /**
   * Create offspring through crossover and mutation
   */
  private createOffspring(parents: SeatingPlan[]): SeatingPlan[] {
    const offspring: SeatingPlan[] = [];
    
    for (let i = 0; i < parents.length - 1; i += 2) {
      const [child1, child2] = this.crossover(parents[i], parents[i + 1]);
      
      // Apply mutation
      if (Math.random() < this.MUTATION_RATE) {
        this.mutate(child1);
      }
      if (Math.random() < this.MUTATION_RATE) {
        this.mutate(child2);
      }
      
      offspring.push(child1, child2);
    }
    
    return offspring;
  }

  /**
   * Crossover operation - combines two parents to create offspring
   */
  private crossover(parent1: SeatingPlan, parent2: SeatingPlan): [SeatingPlan, SeatingPlan] {
    const child1Assignments = new Map<string, string>();
    const child2Assignments = new Map<string, string>();
    
    // Uniform crossover
    this.guests.forEach(guest => {
      if (Math.random() < 0.5) {
        child1Assignments.set(guest.id, parent1.assignments.get(guest.id)!);
        child2Assignments.set(guest.id, parent2.assignments.get(guest.id)!);
      } else {
        child1Assignments.set(guest.id, parent2.assignments.get(guest.id)!);
        child2Assignments.set(guest.id, parent1.assignments.get(guest.id)!);
      }
    });
    
    // Repair offspring to ensure valid seating
    this.repairPlan(child1Assignments);
    this.repairPlan(child2Assignments);
    
    return [
      { assignments: child1Assignments, fitness: 0 },
      { assignments: child2Assignments, fitness: 0 },
    ];
  }

  /**
   * Mutation operation - randomly changes some assignments
   */
  private mutate(plan: SeatingPlan): void {
    const guestIds = Array.from(plan.assignments.keys());
    const numMutations = Math.ceil(guestIds.length * 0.1); // Mutate 10% of assignments
    
    for (let i = 0; i < numMutations; i++) {
      const guest1 = guestIds[Math.floor(Math.random() * guestIds.length)];
      const guest2 = guestIds[Math.floor(Math.random() * guestIds.length)];
      
      if (guest1 !== guest2) {
        // Swap assignments
        const table1 = plan.assignments.get(guest1)!;
        const table2 = plan.assignments.get(guest2)!;
        plan.assignments.set(guest1, table2);
        plan.assignments.set(guest2, table1);
      }
    }
    
    this.repairPlan(plan.assignments);
  }

  /**
   * Repair a seating plan to ensure it respects table capacities
   */
  private repairPlan(assignments: Map<string, string>): void {
    const tableOccupancy = new Map<string, number>();
    
    // Count current occupancy
    this.tables.forEach(table => {
      tableOccupancy.set(table.id, 0);
    });
    
    assignments.forEach((tableId, guestId) => {
      tableOccupancy.set(tableId, (tableOccupancy.get(tableId) || 0) + 1);
    });
    
    // Find over-capacity tables
    const overflowGuests: string[] = [];
    
    this.tables.forEach(table => {
      const occupancy = tableOccupancy.get(table.id) || 0;
      if (occupancy > table.capacity) {
        // Remove excess guests
        const tableGuests = Array.from(assignments.entries())
          .filter(([_, tid]) => tid === table.id)
          .map(([gid, _]) => gid);
        
        const excess = occupancy - table.capacity;
        for (let i = 0; i < excess; i++) {
          const guestToMove = tableGuests[tableGuests.length - 1 - i];
          overflowGuests.push(guestToMove);
          assignments.delete(guestToMove);
        }
      }
    });
    
    // Reassign overflow guests to tables with capacity
    for (const guestId of overflowGuests) {
      const availableTable = this.tables.find(table => {
        const currentOccupancy = Array.from(assignments.values())
          .filter(tid => tid === table.id).length;
        return currentOccupancy < table.capacity;
      });
      
      if (availableTable) {
        assignments.set(guestId, availableTable.id);
      }
    }
  }

  // Helper methods...

  private canAccommodateAllGuests(): boolean {
    const totalCapacity = this.tables.reduce((sum, table) => sum + table.capacity, 0);
    return totalCapacity >= this.guests.length;
  }

  private buildConstraintGraph(): Map<string, ConstraintViolation[]> {
    // Implementation for building constraint graph from preferences
    const constraints = new Map<string, ConstraintViolation[]>();
    // ... constraint building logic
    return constraints;
  }

  private identifyGuestGroups(): string[][] {
    // Group guests by relationships, families, etc.
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    this.guests.forEach(guest => {
      if (!processed.has(guest.id)) {
        const group = this.findRelatedGuests(guest.id, processed);
        if (group.length > 0) {
          groups.push(group);
        }
      }
    });
    
    return groups;
  }

  private findRelatedGuests(guestId: string, processed: Set<string>): string[] {
    // BFS to find all related guests
    const group: string[] = [guestId];
    processed.add(guestId);
    
    // Implementation to find related guests based on relationships
    // ... relationship traversal logic
    
    return group;
  }

  private findBestTableForGroup(group: string[], tableOccupancy: Map<string, string[]>): string | null {
    // Find table with enough capacity for the group
    for (const table of this.tables) {
      const currentOccupancy = tableOccupancy.get(table.id)?.length || 0;
      if (table.capacity - currentOccupancy >= group.length) {
        return table.id;
      }
    }
    return null;
  }

  private findBestTableForGuest(guestId: string, tableOccupancy: Map<string, string[]>): string | null {
    // Find table with available capacity
    for (const table of this.tables) {
      const currentOccupancy = tableOccupancy.get(table.id)?.length || 0;
      if (currentOccupancy < table.capacity) {
        return table.id;
      }
    }
    return null;
  }

  private checkConstraintViolations(plan: SeatingPlan): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    
    // Check each preference
    this.preferences.forEach(pref => {
      // Implementation for checking violations based on preference type
      // ... violation checking logic
    });
    
    return violations;
  }

  private calculateEmptySeats(plan: SeatingPlan): number {
    const tableOccupancy = new Map<string, number>();
    
    plan.assignments.forEach(tableId => {
      tableOccupancy.set(tableId, (tableOccupancy.get(tableId) || 0) + 1);
    });
    
    let emptySeats = 0;
    this.tables.forEach(table => {
      const occupied = tableOccupancy.get(table.id) || 0;
      emptySeats += table.capacity - occupied;
    });
    
    return emptySeats;
  }

  private calculateDistributionUnevenness(plan: SeatingPlan): number {
    // Calculate standard deviation of table occupancy rates
    const occupancyRates: number[] = [];
    
    this.tables.forEach(table => {
      const occupied = Array.from(plan.assignments.values())
        .filter(tid => tid === table.id).length;
      occupancyRates.push(occupied / table.capacity);
    });
    
    const mean = occupancyRates.reduce((a, b) => a + b, 0) / occupancyRates.length;
    const variance = occupancyRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / occupancyRates.length;
    
    return Math.sqrt(variance);
  }

  private calculateGroupCohesion(plan: SeatingPlan): number {
    // Score based on how well groups are kept together
    let cohesionScore = 0;
    const groups = this.identifyGuestGroups();
    
    groups.forEach(group => {
      const tables = new Set<string>();
      group.forEach(guestId => {
        const tableId = plan.assignments.get(guestId);
        if (tableId) tables.add(tableId);
      });
      
      // Bonus for groups at same table
      if (tables.size === 1) {
        cohesionScore += group.length;
      } else {
        // Penalty for split groups
        cohesionScore -= (tables.size - 1) * 2;
      }
    });
    
    return cohesionScore;
  }

  private calculateSideMixing(plan: SeatingPlan): number {
    // Score based on mixing of bride/groom sides
    let mixingScore = 0;
    
    this.tables.forEach(table => {
      const tableGuests = this.guests.filter(g => 
        plan.assignments.get(g.id) === table.id
      );
      
      // Count guests from each side
      const brideSide = tableGuests.filter(g => g.side === 'bride').length;
      const groomSide = tableGuests.filter(g => g.side === 'groom').length;
      
      if (brideSide > 0 && groomSide > 0) {
        // Bonus for mixed tables
        const ratio = Math.min(brideSide, groomSide) / Math.max(brideSide, groomSide);
        mixingScore += ratio * tableGuests.length;
      }
    });
    
    return mixingScore;
  }

  private calculateAgeBalance(plan: SeatingPlan): number {
    // Score based on age distribution at tables
    let balanceScore = 0;
    
    this.tables.forEach(table => {
      const tableGuests = this.guests.filter(g => 
        plan.assignments.get(g.id) === table.id
      );
      
      if (tableGuests.length === 0) return;
      
      // Calculate age variance at table
      const ages = tableGuests.map(g => g.age || 30).filter(age => age > 0);
      if (ages.length === 0) return;
      
      const meanAge = ages.reduce((a, b) => a + b, 0) / ages.length;
      const variance = ages.reduce((sum, age) => sum + Math.pow(age - meanAge, 2), 0) / ages.length;
      
      // Lower variance = better balance
      balanceScore += 100 / (1 + variance);
    });
    
    return balanceScore;
  }

  private calculateAccessibilityScore(plan: SeatingPlan): number {
    // Score based on accessibility requirements being met
    let score = 0;
    
    const accessibilityPrefs = this.preferences.filter(p => 
      p.preference_type === 'wheelchair_accessible'
    );
    
    accessibilityPrefs.forEach(pref => {
      // Check if guests with accessibility needs are at appropriate tables
      // Implementation depends on table metadata about accessibility
      // ... accessibility scoring logic
    });
    
    return score;
  }
}