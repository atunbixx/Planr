# Seating Planner System - Technical Specification

## Overview

The Seating Planner System will provide couples with a comprehensive visual tool to design their wedding reception layout, manage table arrangements, and optimize guest seating based on relationships, preferences, and constraints.

## Core Requirements

### Functional Requirements
1. **Visual Table Designer**: Drag-and-drop interface for table placement
2. **Guest Assignment**: Easy assignment of guests to tables with conflict detection
3. **Seating Optimization**: AI-assisted suggestions based on relationships and preferences
4. **Export Capabilities**: Generate printable seating charts and place cards
5. **Real-time Collaboration**: Allow multiple users to work on seating simultaneously
6. **Mobile Responsiveness**: Full functionality on tablets for on-site adjustments

### Non-Functional Requirements
- **Performance**: <200ms response time for drag operations
- **Scalability**: Support up to 500 guests and 50 tables
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Chrome, Safari, Firefox, Edge (latest 2 versions)

## Database Schema Design

```sql
-- Table layouts for different venue spaces
CREATE TABLE venue_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  venue_name VARCHAR(200),
  dimensions_width INTEGER DEFAULT 1000, -- in pixels for canvas
  dimensions_height INTEGER DEFAULT 800,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(couple_id, name)
);

-- Individual tables within a layout
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES venue_layouts(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  table_name VARCHAR(100), -- e.g., "Bride's Family", "College Friends"
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 20),
  shape TABLE_SHAPE NOT NULL DEFAULT 'round',
  x_position DECIMAL(10,2) NOT NULL,
  y_position DECIMAL(10,2) NOT NULL,
  rotation INTEGER DEFAULT 0, -- degrees
  width DECIMAL(10,2), -- for rectangular tables
  height DECIMAL(10,2), -- for rectangular tables
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_table_number UNIQUE(layout_id, table_number)
);

-- Guest seating assignments
CREATE TABLE seating_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  seat_number INTEGER,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT unique_guest_assignment UNIQUE(guest_id),
  CONSTRAINT unique_table_seat UNIQUE(table_id, seat_number)
);

-- Seating preferences and constraints
CREATE TABLE seating_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  preference_type PREFERENCE_TYPE NOT NULL, -- 'must_sit_together', 'cannot_sit_together', 'near_facility'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Guest relationships for preference rules
CREATE TABLE seating_preference_guests (
  preference_id UUID NOT NULL REFERENCES seating_preferences(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  PRIMARY KEY (preference_id, guest_id)
);

-- Enum types
CREATE TYPE TABLE_SHAPE AS ENUM ('round', 'rectangular', 'square', 'oval', 'custom');
CREATE TYPE PREFERENCE_TYPE AS ENUM (
  'must_sit_together',
  'cannot_sit_together', 
  'near_entrance',
  'near_bar',
  'near_dance_floor',
  'near_restroom',
  'away_from_speakers',
  'wheelchair_accessible'
);

-- Indexes for performance
CREATE INDEX idx_tables_layout ON tables(layout_id);
CREATE INDEX idx_assignments_table ON seating_assignments(table_id);
CREATE INDEX idx_assignments_guest ON seating_assignments(guest_id);
CREATE INDEX idx_preferences_couple ON seating_preferences(couple_id);
```

## API Design

### Seating Service Architecture

```typescript
// src/lib/api/seating.ts
export class SeatingService {
  // Layout Management
  async createLayout(coupleId: string, data: CreateLayoutDto): Promise<VenueLayout>
  async getLayouts(coupleId: string): Promise<VenueLayout[]>
  async updateLayout(layoutId: string, data: UpdateLayoutDto): Promise<VenueLayout>
  async deleteLayout(layoutId: string): Promise<void>
  async duplicateLayout(layoutId: string, newName: string): Promise<VenueLayout>

  // Table Management
  async createTable(layoutId: string, data: CreateTableDto): Promise<Table>
  async updateTable(tableId: string, data: UpdateTableDto): Promise<Table>
  async deleteTable(tableId: string): Promise<void>
  async getTables(layoutId: string): Promise<Table[]>
  async updateTablePosition(tableId: string, x: number, y: number): Promise<Table>

  // Guest Assignment
  async assignGuestToTable(guestId: string, tableId: string, seatNumber?: number): Promise<SeatingAssignment>
  async removeGuestFromTable(guestId: string): Promise<void>
  async swapGuests(guestId1: string, guestId2: string): Promise<void>
  async getUnseatedGuests(coupleId: string): Promise<Guest[]>
  async getTableGuests(tableId: string): Promise<GuestWithAssignment[]>

  // Preferences Management
  async createPreference(coupleId: string, data: CreatePreferenceDto): Promise<SeatingPreference>
  async deletePreference(preferenceId: string): Promise<void>
  async getPreferences(coupleId: string): Promise<SeatingPreferenceWithGuests[]>
  async validateSeating(layoutId: string): Promise<ValidationResult[]>

  // Optimization Engine
  async suggestOptimalSeating(layoutId: string, options?: OptimizationOptions): Promise<SeatingPlan>
  async autoAssignRemaining(layoutId: string): Promise<SeatingAssignment[]>
  
  // Export Functions
  async exportSeatingChart(layoutId: string, format: 'pdf' | 'png' | 'csv'): Promise<Buffer>
  async generatePlaceCards(layoutId: string): Promise<Buffer>
  async exportGuestList(layoutId: string): Promise<Buffer>
}
```

### REST API Endpoints

```typescript
// Layout Management
POST   /api/seating/layouts          - Create new layout
GET    /api/seating/layouts          - Get all layouts for couple
GET    /api/seating/layouts/:id      - Get specific layout with tables
PUT    /api/seating/layouts/:id      - Update layout
DELETE /api/seating/layouts/:id      - Delete layout
POST   /api/seating/layouts/:id/duplicate - Duplicate layout

// Table Management  
POST   /api/seating/tables           - Create table
PUT    /api/seating/tables/:id       - Update table
DELETE /api/seating/tables/:id       - Delete table
PUT    /api/seating/tables/:id/position - Update table position

// Guest Assignment
POST   /api/seating/assignments      - Assign guest to table
DELETE /api/seating/assignments/:guestId - Remove guest assignment
POST   /api/seating/assignments/swap - Swap two guests
GET    /api/seating/guests/unseated  - Get unassigned guests

// Preferences
POST   /api/seating/preferences      - Create preference rule
DELETE /api/seating/preferences/:id  - Delete preference
GET    /api/seating/preferences      - Get all preferences
POST   /api/seating/validate         - Validate current seating

// Optimization
POST   /api/seating/optimize         - Get AI seating suggestions
POST   /api/seating/auto-assign      - Auto-assign remaining guests

// Export
GET    /api/seating/export/chart     - Export seating chart
GET    /api/seating/export/cards     - Generate place cards
GET    /api/seating/export/list      - Export guest list by table
```

## Frontend Architecture

### Component Structure

```typescript
// Main Components
SeatingPlanner/
├── SeatingPlannerContainer.tsx    // Main container with state management
├── VenueCanvas/
│   ├── Canvas.tsx                 // Konva/Fabric.js canvas wrapper
│   ├── Table.tsx                  // Individual table component
│   ├── Grid.tsx                   // Snap-to-grid overlay
│   └── Controls.tsx               // Zoom, pan, grid toggle
├── GuestPanel/
│   ├── GuestList.tsx              // Unseated guests list
│   ├── GuestCard.tsx              // Draggable guest card
│   ├── SearchFilter.tsx           // Guest search/filter
│   └── GroupSelector.tsx          // Filter by guest groups
├── TablePanel/
│   ├── TableList.tsx              // List of all tables
│   ├── TableCard.tsx              // Table summary card
│   ├── TableGuests.tsx            // Guests at specific table
│   └── TableSettings.tsx          // Edit table properties
├── PreferencesPanel/
│   ├── PreferenceList.tsx         // All seating rules
│   ├── PreferenceForm.tsx         // Create/edit rules
│   └── ConflictIndicator.tsx      // Show rule violations
├── Toolbar/
│   ├── LayoutSelector.tsx         // Switch between layouts
│   ├── AddTableButton.tsx         // Add new tables
│   ├── OptimizeButton.tsx         // AI optimization
│   ├── ValidateButton.tsx         // Check constraints
│   └── ExportMenu.tsx             // Export options
└── Mobile/
    ├── MobileCanvas.tsx           // Touch-optimized canvas
    └── MobileControls.tsx         // Mobile-specific UI

// Shared Components
components/seating/
├── DraggableGuest.tsx             // Reusable draggable guest
├── TableShape.tsx                 // Renders different table shapes
├── SeatPosition.tsx               // Individual seat marker
├── ValidationMessage.tsx          // Constraint violation alerts
└── LoadingStates.tsx              // Skeleton loaders
```

### State Management

```typescript
// Using Zustand for seating state
interface SeatingStore {
  // Layout State
  currentLayout: VenueLayout | null
  layouts: VenueLayout[]
  
  // Table State
  tables: Table[]
  selectedTable: string | null
  hoveredTable: string | null
  
  // Guest State
  guests: Guest[]
  assignments: SeatingAssignment[]
  draggedGuest: Guest | null
  
  // Preferences
  preferences: SeatingPreference[]
  violations: ValidationResult[]
  
  // UI State
  zoom: number
  panPosition: { x: number, y: number }
  showGrid: boolean
  snapToGrid: boolean
  
  // Actions
  loadLayout: (layoutId: string) => Promise<void>
  createTable: (table: CreateTableDto) => Promise<void>
  updateTablePosition: (tableId: string, x: number, y: number) => void
  assignGuest: (guestId: string, tableId: string) => Promise<void>
  validateSeating: () => Promise<void>
  optimizeSeating: () => Promise<void>
}
```

### Canvas Implementation

```typescript
// Using Konva.js for the visual designer
import { Stage, Layer, Group, Circle, Rect, Text } from 'react-konva';

const VenueCanvas: React.FC = () => {
  const { tables, zoom, panPosition } = useSeatingStore();
  
  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={zoom}
      scaleY={zoom}
      x={panPosition.x}
      y={panPosition.y}
      draggable
      onWheel={handleZoom}
    >
      <Layer>
        <Grid />
        {tables.map(table => (
          <TableComponent
            key={table.id}
            table={table}
            onDragEnd={handleTableMove}
            onClick={handleTableSelect}
          />
        ))}
      </Layer>
    </Stage>
  );
};

// Individual table component
const TableComponent: React.FC<{ table: Table }> = ({ table }) => {
  const guests = useTableGuests(table.id);
  
  return (
    <Group x={table.x_position} y={table.y_position} draggable>
      {table.shape === 'round' ? (
        <Circle radius={50} fill="#f0f0f0" stroke="#333" />
      ) : (
        <Rect width={table.width} height={table.height} fill="#f0f0f0" stroke="#333" />
      )}
      <Text text={table.table_number} />
      {guests.map((guest, index) => (
        <SeatMarker
          key={guest.id}
          guest={guest}
          seatNumber={index}
          tableShape={table.shape}
        />
      ))}
    </Group>
  );
};
```

## Optimization Algorithm

### Seating Optimization Engine

```typescript
interface OptimizationCriteria {
  // Relationship-based
  prioritizeFamilyGroups: boolean
  mixGuestSides: boolean // Mix bride/groom sides
  
  // Preference-based
  respectAllConstraints: boolean
  prioritizeAccessibility: boolean
  
  // Social dynamics
  balanceTableAges: boolean
  avoidIsolatedGuests: boolean
  
  // Table utilization
  minimizeEmptySeats: boolean
  preferEvenDistribution: boolean
}

class SeatingOptimizer {
  // Main optimization function
  async optimizeSeating(
    layout: VenueLayout,
    guests: Guest[],
    preferences: SeatingPreference[],
    criteria: OptimizationCriteria
  ): Promise<SeatingPlan> {
    // Step 1: Build constraint graph
    const constraints = this.buildConstraintGraph(guests, preferences);
    
    // Step 2: Group guests by relationships
    const guestGroups = this.identifyGuestGroups(guests, constraints);
    
    // Step 3: Calculate table capacities
    const tableCapacities = this.calculateCapacities(layout.tables);
    
    // Step 4: Apply genetic algorithm
    const population = this.generateInitialPopulation(guestGroups, tableCapacities);
    const optimizedPlan = this.runGeneticAlgorithm(population, constraints, criteria);
    
    // Step 5: Validate and return
    return this.validateAndFinalize(optimizedPlan, constraints);
  }
  
  // Genetic algorithm for optimization
  private runGeneticAlgorithm(
    initialPopulation: SeatingPlan[],
    constraints: ConstraintGraph,
    criteria: OptimizationCriteria
  ): SeatingPlan {
    let population = initialPopulation;
    const MAX_GENERATIONS = 100;
    
    for (let gen = 0; gen < MAX_GENERATIONS; gen++) {
      // Evaluate fitness of each plan
      const scored = population.map(plan => ({
        plan,
        fitness: this.calculateFitness(plan, constraints, criteria)
      }));
      
      // Select best plans
      const selected = this.selectBestPlans(scored);
      
      // Create new generation
      population = this.crossoverAndMutate(selected);
      
      // Check for convergence
      if (this.hasConverged(scored)) break;
    }
    
    return population[0];
  }
  
  // Fitness calculation
  private calculateFitness(
    plan: SeatingPlan,
    constraints: ConstraintGraph,
    criteria: OptimizationCriteria
  ): number {
    let score = 1000; // Base score
    
    // Penalty for constraint violations
    const violations = this.countViolations(plan, constraints);
    score -= violations.hard * 100; // Hard constraints
    score -= violations.soft * 10;   // Soft preferences
    
    // Bonus for criteria satisfaction
    if (criteria.mixGuestSides) {
      score += this.calculateSideMixingScore(plan) * 20;
    }
    
    if (criteria.balanceTableAges) {
      score += this.calculateAgeBalanceScore(plan) * 15;
    }
    
    if (criteria.minimizeEmptySeats) {
      score += this.calculateCapacityUtilization(plan) * 25;
    }
    
    return Math.max(0, score);
  }
}
```

## Real-time Collaboration

### WebSocket Integration

```typescript
// Real-time updates using Socket.io
interface SeatingWebSocketEvents {
  // Table events
  'table:created': (table: Table) => void
  'table:updated': (table: Table) => void
  'table:deleted': (tableId: string) => void
  'table:moved': (tableId: string, x: number, y: number) => void
  
  // Assignment events
  'guest:assigned': (assignment: SeatingAssignment) => void
  'guest:unassigned': (guestId: string) => void
  'guests:swapped': (guestId1: string, guestId2: string) => void
  
  // User presence
  'user:joined': (user: { id: string, name: string }) => void
  'user:left': (userId: string) => void
  'user:cursor': (userId: string, x: number, y: number) => void
}

// Client implementation
const useSeatingWebSocket = (layoutId: string) => {
  useEffect(() => {
    const socket = io('/seating', {
      query: { layoutId }
    });
    
    socket.on('table:moved', (tableId, x, y) => {
      useSeatingStore.getState().updateTablePosition(tableId, x, y);
    });
    
    socket.on('guest:assigned', (assignment) => {
      useSeatingStore.getState().addAssignment(assignment);
    });
    
    return () => socket.disconnect();
  }, [layoutId]);
};
```

## Mobile Optimization

### Touch Interactions

```typescript
// Mobile-specific controls
const MobileSeatingPlanner: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'view' | 'assign' | 'move'>('view');
  
  const handleGuestDrop = useCallback((guest: Guest, table: Table) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    // Visual feedback
    showDropAnimation(table);
    
    // Assign guest
    assignGuestToTable(guest.id, table.id);
  }, []);
  
  return (
    <div className="mobile-seating-planner">
      <MobileToolbar mode={selectedMode} onModeChange={setSelectedMode} />
      
      <div className="canvas-container">
        <PinchZoomPan>
          <VenueCanvas
            onTableTap={handleTableTap}
            onGuestDrop={handleGuestDrop}
            touchMode={selectedMode}
          />
        </PinchZoomPan>
      </div>
      
      <BottomSheet>
        {selectedMode === 'assign' && <GuestList />}
        {selectedMode === 'move' && <TableList />}
      </BottomSheet>
    </div>
  );
};
```

## Performance Optimizations

### Canvas Rendering

```typescript
// Virtualization for large guest lists
const VirtualizedGuestList: React.FC = () => {
  const guests = useUnseatedGuests();
  const rowVirtualizer = useVirtual({
    size: guests.length,
    parentRef: parentRef,
    estimateSize: useCallback(() => 80, []),
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="guest-list">
      <div style={{ height: `${rowVirtualizer.totalSize}px` }}>
        {rowVirtualizer.virtualItems.map(virtualRow => (
          <GuestCard
            key={guests[virtualRow.index].id}
            guest={guests[virtualRow.index]}
            style={{
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Debounced table position updates
const useTableDrag = (tableId: string) => {
  const updatePosition = useDebouncedCallback(
    (x: number, y: number) => {
      api.updateTablePosition(tableId, x, y);
    },
    100
  );
  
  return {
    onDrag: (x: number, y: number) => {
      // Update local state immediately
      useSeatingStore.getState().setTablePosition(tableId, x, y);
      // Debounce API call
      updatePosition(x, y);
    }
  };
};
```

## Export Functionality

### PDF Generation

```typescript
// Server-side PDF generation
import PDFDocument from 'pdfkit';

export async function generateSeatingChartPDF(layout: VenueLayout): Promise<Buffer> {
  const doc = new PDFDocument({ 
    size: 'A3',
    layout: 'landscape',
    margin: 50 
  });
  
  // Add title
  doc.fontSize(24).text(`Seating Chart - ${layout.name}`, { align: 'center' });
  doc.fontSize(14).text(layout.venue_name || '', { align: 'center' });
  doc.moveDown();
  
  // Draw venue layout
  const scale = calculateScale(layout.dimensions_width, layout.dimensions_height);
  
  for (const table of layout.tables) {
    drawTable(doc, table, scale);
    drawTableGuests(doc, table, scale);
  }
  
  // Add legend
  drawLegend(doc, layout);
  
  // Add guest list by table
  doc.addPage();
  drawGuestListByTable(doc, layout);
  
  return doc.end();
}

// Place card generation
export async function generatePlaceCards(layout: VenueLayout): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [252, 144], // 3.5" x 2" cards
    margin: 18
  });
  
  const assignments = await getAssignmentsByTable(layout.id);
  
  for (const [index, assignment] of assignments.entries()) {
    if (index > 0) doc.addPage();
    
    // Guest name
    doc.fontSize(24).text(assignment.guest.name, { align: 'center' });
    
    // Table number
    doc.fontSize(16).text(`Table ${assignment.table.table_number}`, { 
      align: 'center' 
    });
    
    // Optional meal choice
    if (assignment.guest.meal_choice) {
      doc.fontSize(12).text(assignment.guest.meal_choice, { 
        align: 'center' 
      });
    }
  }
  
  return doc.end();
}
```

## Testing Strategy

### Unit Tests

```typescript
// Service layer tests
describe('SeatingService', () => {
  describe('assignGuestToTable', () => {
    it('should assign guest to available seat', async () => {
      const guest = await createTestGuest();
      const table = await createTestTable({ capacity: 10 });
      
      const assignment = await seatingService.assignGuestToTable(
        guest.id, 
        table.id
      );
      
      expect(assignment.guest_id).toBe(guest.id);
      expect(assignment.table_id).toBe(table.id);
    });
    
    it('should reject assignment to full table', async () => {
      const table = await createTestTable({ capacity: 2 });
      await fillTable(table.id);
      
      await expect(
        seatingService.assignGuestToTable(guestId, table.id)
      ).rejects.toThrow('Table is at full capacity');
    });
  });
  
  describe('optimizeSeating', () => {
    it('should respect hard constraints', async () => {
      const layout = await createTestLayout();
      const guests = await createTestGuests(50);
      const mustSitTogether = await createPreference({
        type: 'must_sit_together',
        guests: [guests[0].id, guests[1].id]
      });
      
      const plan = await seatingService.optimizeSeating(layout.id);
      
      const guest1Table = plan.assignments.find(a => a.guest_id === guests[0].id);
      const guest2Table = plan.assignments.find(a => a.guest_id === guests[1].id);
      
      expect(guest1Table.table_id).toBe(guest2Table.table_id);
    });
  });
});
```

### Integration Tests

```typescript
// E2E canvas interaction tests
describe('Seating Planner E2E', () => {
  it('should drag guest to table', async () => {
    await page.goto('/dashboard/seating');
    
    // Drag guest to table
    const guest = await page.$('[data-guest-id="guest-1"]');
    const table = await page.$('[data-table-id="table-1"]');
    
    await guest.dragTo(table);
    
    // Verify assignment
    await expect(page).toHaveText('[data-table-id="table-1"] .guest-count', '1/10');
  });
  
  it('should show validation errors', async () => {
    await page.goto('/dashboard/seating');
    
    // Create conflicting assignments
    await assignGuestToTable('guest-1', 'table-1');
    await assignGuestToTable('guest-2', 'table-1');
    
    // Create cannot-sit-together rule
    await createPreference({
      type: 'cannot_sit_together',
      guests: ['guest-1', 'guest-2']
    });
    
    // Validate
    await page.click('[data-action="validate"]');
    
    // Check for error
    await expect(page).toHaveText('.validation-error', 'Guests cannot sit together');
  });
});
```

## Deployment Considerations

### Infrastructure Requirements
- **Database**: Additional tables ~5-10GB for 10,000 active couples
- **Storage**: ~500MB for exported PDFs and caching
- **Compute**: Canvas rendering requires client-side resources
- **WebSocket**: Real-time collaboration needs persistent connections

### Performance Targets
- Initial load: <2s for 200 guest wedding
- Drag response: <16ms (60fps)
- Optimization: <5s for 200 guests
- Export generation: <3s for PDF

### Monitoring
- Canvas FPS and interaction latency
- WebSocket connection stability
- Optimization algorithm performance
- Export generation success rate

---

## Implementation Timeline

### Week 1-2: Database & API
- Create database migrations
- Implement SeatingService
- Build REST API endpoints
- Add authentication/authorization

### Week 3-4: Core Frontend
- Setup canvas infrastructure
- Implement table management
- Basic drag-and-drop assignments
- Mobile responsive design

### Week 5: Advanced Features
- Optimization algorithm
- Real-time collaboration
- Preference management
- Validation system

### Week 6: Polish & Export
- Export functionality
- Performance optimization
- Testing & bug fixes
- Documentation

This comprehensive seating planner will transform the wedding planning experience by solving one of the most time-consuming and stressful aspects of wedding preparation.