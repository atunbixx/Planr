import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface WeddingPlannerDB extends DBSchema {
  couples: {
    key: string;
    value: {
      id: string;
      name1: string;
      name2: string;
      email: string;
      phone?: string;
      wedding_date?: string;
      venue?: string;
      theme_color?: string;
      preferences?: any;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
      last_synced?: string;
    };
  };
  vendors: {
    key: string;
    value: {
      id: string;
      user_id: string;
      name: string;
      category: string;
      email?: string;
      phone?: string;
      website?: string;
      price?: number;
      notes?: string;
      rating?: number;
      is_booked?: boolean;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
      last_synced?: string;
    };
    indexes: { 'by-category': string; 'by-status': string };
  };
  budget_items: {
    key: string;
    value: {
      id: string;
      user_id: string;
      vendor_id?: string;
      category: string;
      name: string;
      estimated_cost: number;
      actual_cost?: number;
      paid_amount?: number;
      is_paid?: boolean;
      due_date?: string;
      notes?: string;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
      last_synced?: string;
    };
    indexes: { 'by-category': string; 'by-vendor': string };
  };
  photos: {
    key: string;
    value: {
      id: string;
      user_id: string;
      url: string;
      public_id?: string;
      category?: string;
      caption?: string;
      tags?: string[];
      is_favorite?: boolean;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
      last_synced?: string;
      blob?: Blob; // Store actual image data for offline viewing
    };
    indexes: { 'by-category': string; 'by-favorite': number };
  };
  messages: {
    key: string;
    value: {
      id: string;
      user_id: string;
      vendor_id?: string;
      content: string;
      sender_type: 'user' | 'vendor';
      is_read?: boolean;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
      last_synced?: string;
    };
    indexes: { 'by-vendor': string; 'by-read': number };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      created_at: string;
      retry_count: number;
      last_error?: string;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      updated_at: string;
    };
  };
}

const DB_NAME = 'wedding-planner-offline';
const DB_VERSION = 1;

class OfflineDatabase {
  private db: IDBPDatabase<WeddingPlannerDB> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<WeddingPlannerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Couples store
        if (!db.objectStoreNames.contains('couples')) {
          db.createObjectStore('couples', { keyPath: 'id' });
        }

        // Vendors store
        if (!db.objectStoreNames.contains('vendors')) {
          const vendorStore = db.createObjectStore('vendors', { keyPath: 'id' });
          vendorStore.createIndex('by-category', 'category');
          vendorStore.createIndex('by-status', 'sync_status');
        }

        // Budget items store
        if (!db.objectStoreNames.contains('budget_items')) {
          const budgetStore = db.createObjectStore('budget_items', { keyPath: 'id' });
          budgetStore.createIndex('by-category', 'category');
          budgetStore.createIndex('by-vendor', 'vendor_id');
        }

        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-category', 'category');
          photoStore.createIndex('by-favorite', 'is_favorite');
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-vendor', 'vendor_id');
          messageStore.createIndex('by-read', 'is_read');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }

  async getDb(): Promise<IDBPDatabase<WeddingPlannerDB>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  // Couple operations
  async saveCoupleProfile(profile: WeddingPlannerDB['couples']['value']): Promise<void> {
    const db = await this.getDb();
    await db.put('couples', {
      ...profile,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
  }

  async getCoupleProfile(id: string): Promise<WeddingPlannerDB['couples']['value'] | undefined> {
    const db = await this.getDb();
    return db.get('couples', id);
  }

  // Vendor operations
  async saveVendor(vendor: WeddingPlannerDB['vendors']['value']): Promise<void> {
    const db = await this.getDb();
    await db.put('vendors', {
      ...vendor,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await this.addToSyncQueue('vendors', 'update', vendor);
  }

  async getVendors(userId: string): Promise<WeddingPlannerDB['vendors']['value'][]> {
    const db = await this.getDb();
    const vendors = await db.getAll('vendors');
    return vendors.filter(v => v.user_id === userId);
  }

  async getVendorsByCategory(category: string): Promise<WeddingPlannerDB['vendors']['value'][]> {
    const db = await this.getDb();
    return db.getAllFromIndex('vendors', 'by-category', category);
  }

  async deleteVendor(id: string): Promise<void> {
    const db = await this.getDb();
    const vendor = await db.get('vendors', id);
    if (vendor) {
      await db.delete('vendors', id);
      await this.addToSyncQueue('vendors', 'delete', { id });
    }
  }

  // Budget operations
  async saveBudgetItem(item: WeddingPlannerDB['budget_items']['value']): Promise<void> {
    const db = await this.getDb();
    await db.put('budget_items', {
      ...item,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await this.addToSyncQueue('budget_items', 'update', item);
  }

  async getBudgetItems(userId: string): Promise<WeddingPlannerDB['budget_items']['value'][]> {
    const db = await this.getDb();
    const items = await db.getAll('budget_items');
    return items.filter(item => item.user_id === userId);
  }

  async deleteBudgetItem(id: string): Promise<void> {
    const db = await this.getDb();
    const item = await db.get('budget_items', id);
    if (item) {
      await db.delete('budget_items', id);
      await this.addToSyncQueue('budget_items', 'delete', { id });
    }
  }

  // Photo operations
  async savePhoto(photo: WeddingPlannerDB['photos']['value'], blob?: Blob): Promise<void> {
    const db = await this.getDb();
    await db.put('photos', {
      ...photo,
      blob,
      updated_at: new Date().toISOString(),
      sync_status: blob ? 'pending' : photo.sync_status,
    });
    if (blob) {
      await this.addToSyncQueue('photos', 'create', photo);
    }
  }

  async getPhotos(userId: string): Promise<WeddingPlannerDB['photos']['value'][]> {
    const db = await this.getDb();
    const photos = await db.getAll('photos');
    return photos.filter(photo => photo.user_id === userId);
  }

  async getPhotosByCategory(category: string): Promise<WeddingPlannerDB['photos']['value'][]> {
    const db = await this.getDb();
    return db.getAllFromIndex('photos', 'by-category', category);
  }

  async deletePhoto(id: string): Promise<void> {
    const db = await this.getDb();
    const photo = await db.get('photos', id);
    if (photo) {
      await db.delete('photos', id);
      await this.addToSyncQueue('photos', 'delete', { id, public_id: photo.public_id });
    }
  }

  // Message operations
  async saveMessage(message: WeddingPlannerDB['messages']['value']): Promise<void> {
    const db = await this.getDb();
    await db.put('messages', {
      ...message,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await this.addToSyncQueue('messages', 'create', message);
  }

  async getMessages(userId: string): Promise<WeddingPlannerDB['messages']['value'][]> {
    const db = await this.getDb();
    const messages = await db.getAll('messages');
    return messages.filter(msg => msg.user_id === userId);
  }

  async markMessageAsRead(id: string): Promise<void> {
    const db = await this.getDb();
    const message = await db.get('messages', id);
    if (message) {
      await db.put('messages', {
        ...message,
        is_read: true,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      await this.addToSyncQueue('messages', 'update', { id, is_read: true });
    }
  }

  // Sync queue operations
  private async addToSyncQueue(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const db = await this.getDb();
    const id = `${table}-${operation}-${Date.now()}-${Math.random()}`;
    await db.put('sync_queue', {
      id,
      table,
      operation,
      data,
      created_at: new Date().toISOString(),
      retry_count: 0,
    });
  }

  async getSyncQueue(): Promise<WeddingPlannerDB['sync_queue']['value'][]> {
    const db = await this.getDb();
    return db.getAll('sync_queue');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('sync_queue', id);
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<WeddingPlannerDB['sync_queue']['value']>
  ): Promise<void> {
    const db = await this.getDb();
    const item = await db.get('sync_queue', id);
    if (item) {
      await db.put('sync_queue', {
        ...item,
        ...updates,
      });
    }
  }

  // Settings operations
  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.getDb();
    await db.put('settings', {
      key,
      value,
      updated_at: new Date().toISOString(),
    });
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.getDb();
    const setting = await db.get('settings', key);
    return setting?.value;
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(
      ['couples', 'vendors', 'budget_items', 'photos', 'messages', 'sync_queue', 'settings'],
      'readwrite'
    );
    
    await Promise.all([
      tx.objectStore('couples').clear(),
      tx.objectStore('vendors').clear(),
      tx.objectStore('budget_items').clear(),
      tx.objectStore('photos').clear(),
      tx.objectStore('messages').clear(),
      tx.objectStore('sync_queue').clear(),
      tx.objectStore('settings').clear(),
    ]);
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pending: number;
    errors: number;
    lastSync?: string;
  }> {
    const db = await this.getDb();
    const queue = await db.getAll('sync_queue');
    const lastSync = await this.getSetting('last_sync');
    
    return {
      pending: queue.filter(item => item.retry_count < 3).length,
      errors: queue.filter(item => item.retry_count >= 3).length,
      lastSync,
    };
  }
}

// Export singleton instance
export const offlineDb = new OfflineDatabase();

// Export types
export type { WeddingPlannerDB };