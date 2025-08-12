import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Guest, SeatingAssignment, SeatingPreference, Table, VenueLayout } from '@prisma/client';

interface TableWithAssignments extends Table {
  assignments: (SeatingAssignment & { guest: Guest })[];
}

interface SeatingStore {
  // Layout State
  currentLayout: VenueLayout | null;
  layouts: VenueLayout[];
  
  // Table State
  tables: TableWithAssignments[];
  selectedTableId: string | null;
  hoveredTableId: string | null;
  
  // Guest State
  guests: Guest[];
  unassignedGuests: Guest[];
  draggedGuestId: string | null;
  
  // Preferences
  preferences: (SeatingPreference & { guests: Guest[] })[];
  violations: ValidationViolation[];
  
  // UI State
  zoom: number;
  panPosition: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  sidebarOpen: boolean;
  activePanel: 'guests' | 'tables' | 'preferences';
  
  // Actions - Layout
  setCurrentLayout: (layout: VenueLayout | null) => void;
  loadLayout: (layoutId: string) => Promise<void>;
  createLayout: (name: string, venueName?: string) => Promise<void>;
  updateLayout: (layoutId: string, updates: Partial<VenueLayout>) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  
  // Actions - Tables
  createTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTable: (tableId: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  selectTable: (tableId: string | null) => void;
  hoverTable: (tableId: string | null) => void;
  
  // Actions - Guest Assignment
  assignGuest: (guestId: string, tableId: string, seatNumber?: number) => Promise<void>;
  unassignGuest: (guestId: string) => Promise<void>;
  swapGuests: (guestId1: string, guestId2: string) => Promise<void>;
  setDraggedGuest: (guestId: string | null) => void;
  loadGuests: (coupleId: string) => Promise<void>;
  
  // Actions - Preferences
  createPreference: (type: string, guestIds: string[]) => Promise<void>;
  deletePreference: (preferenceId: string) => Promise<void>;
  validateSeating: () => Promise<void>;
  
  // Actions - UI
  setZoom: (zoom: number) => void;
  setPanPosition: (position: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: 'guests' | 'tables' | 'preferences') => void;
  
  // Helpers
  getTableGuestCount: (tableId: string) => number;
  getGuestTable: (guestId: string) => Table | null;
  canAssignGuest: (guestId: string, tableId: string) => boolean;
  getTableViolations: (tableId: string) => ValidationViolation[];
}

interface ValidationViolation {
  type: 'capacity' | 'preference' | 'accessibility';
  severity: 'error' | 'warning';
  message: string;
  guestIds?: string[];
  tableId?: string;
}

// Mock API functions (replace with actual API calls)
const api = {
  async fetchLayout(layoutId: string): Promise<VenueLayout> {
    // Replace with actual API call
    return {} as VenueLayout;
  },
  
  async fetchTables(layoutId: string): Promise<TableWithAssignments[]> {
    // Replace with actual API call
    return [];
  },
  
  async fetchGuests(coupleId: string): Promise<Guest[]> {
    // Replace with actual API call
    return [];
  },
  
  async fetchPreferences(coupleId: string): Promise<(SeatingPreference & { guests: Guest[] })[]> {
    // Replace with actual API call
    return [];
  },
  
  async createTable(table: any): Promise<Table> {
    // Replace with actual API call
    return {} as Table;
  },
  
  async updateTable(tableId: string, updates: any): Promise<Table> {
    // Replace with actual API call
    return {} as Table;
  },
  
  async deleteTable(tableId: string): Promise<void> {
    // Replace with actual API call
  },
  
  async assignGuest(guestId: string, tableId: string, seatNumber?: number): Promise<SeatingAssignment> {
    // Replace with actual API call
    return {} as SeatingAssignment;
  },
  
  async unassignGuest(guestId: string): Promise<void> {
    // Replace with actual API call
  },
};

export const useSeatingStore = create<SeatingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLayout: null,
      layouts: [],
      tables: [],
      selectedTableId: null,
      hoveredTableId: null,
      guests: [],
      unassignedGuests: [],
      draggedGuestId: null,
      preferences: [],
      violations: [],
      zoom: 1,
      panPosition: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      sidebarOpen: true,
      activePanel: 'guests',
      
      // Layout actions
      setCurrentLayout: (layout) => set({ currentLayout: layout }),
      
      loadLayout: async (layoutId) => {
        try {
          const [layout, tables, preferences] = await Promise.all([
            api.fetchLayout(layoutId),
            api.fetchTables(layoutId),
            api.fetchPreferences(layout.coupleId),
          ]);
          
          const guests = await api.fetchGuests(layout.coupleId);
          const assignedGuestIds = new Set(
            tables.flatMap(t => t.assignments.map(a => a.guestId))
          );
          const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id));
          
          set({
            currentLayout: layout,
            tables,
            guests,
            unassignedGuests,
            preferences,
          });
        } catch (error) {
          console.error('Failed to load layout:', error);
        }
      },
      
      createLayout: async (name, venueName) => {
        // Implementation
      },
      
      updateLayout: async (layoutId, updates) => {
        // Implementation
      },
      
      deleteLayout: async (layoutId) => {
        // Implementation
      },
      
      // Table actions
      createTable: async (tableData) => {
        try {
          const newTable = await api.createTable({
            ...tableData,
            layout_id: get().currentLayout?.id,
          });
          
          set((state) => ({
            tables: [...state.tables, { ...newTable, assignments: [] }],
          }));
        } catch (error) {
          console.error('Failed to create table:', error);
        }
      },
      
      updateTable: async (tableId, updates) => {
        try {
          const updatedTable = await api.updateTable(tableId, updates);
          
          set((state) => ({
            tables: state.tables.map((t) =>
              t.id === tableId ? { ...t, ...updatedTable } : t
            ),
          }));
        } catch (error) {
          console.error('Failed to update table:', error);
        }
      },
      
      deleteTable: async (tableId) => {
        try {
          await api.deleteTable(tableId);
          
          set((state) => ({
            tables: state.tables.filter((t) => t.id !== tableId),
            selectedTableId: state.selectedTableId === tableId ? null : state.selectedTableId,
          }));
        } catch (error) {
          console.error('Failed to delete table:', error);
        }
      },
      
      updateTablePosition: (tableId, x, y) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, x_position: x, y_position: y } : t
          ),
        }));
      },
      
      selectTable: (tableId) => set({ selectedTableId: tableId }),
      hoverTable: (tableId) => set({ hoveredTableId: tableId }),
      
      // Guest assignment actions
      assignGuest: async (guestId, tableId, seatNumber) => {
        try {
          const assignment = await api.assignGuest(guestId, tableId, seatNumber);
          const guest = get().guests.find(g => g.id === guestId);
          
          if (!guest) return;
          
          set((state) => ({
            tables: state.tables.map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    assignments: [...t.assignments, { ...assignment, guest }],
                  }
                : t
            ),
            unassignedGuests: state.unassignedGuests.filter((g) => g.id !== guestId),
            draggedGuestId: null,
          }));
        } catch (error) {
          console.error('Failed to assign guest:', error);
        }
      },
      
      unassignGuest: async (guestId) => {
        try {
          await api.unassignGuest(guestId);
          const guest = get().guests.find(g => g.id === guestId);
          
          if (!guest) return;
          
          set((state) => ({
            tables: state.tables.map((t) => ({
              ...t,
              assignments: t.assignments.filter((a) => a.guestId !== guestId),
            })),
            unassignedGuests: [...state.unassignedGuests, guest],
          }));
        } catch (error) {
          console.error('Failed to unassign guest:', error);
        }
      },
      
      swapGuests: async (guestId1, guestId2) => {
        // Implementation
      },
      
      setDraggedGuest: (guestId) => set({ draggedGuestId: guestId }),
      
      loadGuests: async (coupleId) => {
        try {
          const guests = await api.fetchGuests(coupleId);
          set({ guests });
        } catch (error) {
          console.error('Failed to load guests:', error);
        }
      },
      
      // Preference actions
      createPreference: async (type, guestIds) => {
        // Implementation
      },
      
      deletePreference: async (preferenceId) => {
        // Implementation
      },
      
      validateSeating: async () => {
        // Implementation
      },
      
      // UI actions
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
      setPanPosition: (position) => set({ panPosition: position }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      setGridSize: (size) => set({ gridSize: size }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      
      // Helpers
      getTableGuestCount: (tableId) => {
        const table = get().tables.find((t) => t.id === tableId);
        return table?.assignments.length || 0;
      },
      
      getGuestTable: (guestId) => {
        const table = get().tables.find((t) =>
          t.assignments.some((a) => a.guestId === guestId)
        );
        return table || null;
      },
      
      canAssignGuest: (guestId, tableId) => {
        const table = get().tables.find((t) => t.id === tableId);
        if (!table) return false;
        
        // Check capacity
        if (table.assignments.length >= table.capacity) return false;
        
        // Check if guest is already assigned
        const isAssigned = get().tables.some((t) =>
          t.assignments.some((a) => a.guestId === guestId)
        );
        if (isAssigned) return false;
        
        // Check preferences
        // TODO: Implement preference validation
        
        return true;
      },
      
      getTableViolations: (tableId) => {
        const violations: ValidationViolation[] = [];
        const table = get().tables.find((t) => t.id === tableId);
        
        if (!table) return violations;
        
        // Check capacity
        if (table.assignments.length > table.capacity) {
          violations.push({
            type: 'capacity',
            severity: 'error',
            message: `Table is over capacity (${table.assignments.length}/${table.capacity})`,
            tableId,
          });
        }
        
        // TODO: Check preferences
        
        return violations;
      },
    }),
    {
      name: 'seating-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        zoom: state.zoom,
        panPosition: state.panPosition,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        sidebarOpen: state.sidebarOpen,
        activePanel: state.activePanel,
      }),
    }
  )
);