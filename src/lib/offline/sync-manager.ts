import { offlineDb, WeddingPlannerDB } from './db';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.sync();
      }
    });
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Sync already in progress or offline'],
      };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all items from sync queue
      const queue = await offlineDb.getSyncQueue();

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await offlineDb.removeSyncQueueItem(item.id);
          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to sync ${item.table} ${item.operation}: ${error}`);

          // Update retry count
          await offlineDb.updateSyncQueueItem(item.id, {
            retry_count: item.retry_count + 1,
            last_error: String(error),
          });

          // Remove from queue if too many retries
          if (item.retry_count >= 3) {
            await offlineDb.removeSyncQueueItem(item.id);
          }
        }
      }

      // Update last sync time
      await offlineDb.setSetting('last_sync', new Date().toISOString());

      // Sync down latest data from server
      await this.syncFromServer();

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async syncItem(item: WeddingPlannerDB['sync_queue']['value']) {
    const { table, operation, data } = item;

    let endpoint = '';
    let method = 'POST';
    let body = data;

    switch (table) {
      case 'vendors':
        endpoint = '/api/vendors';
        if (operation === 'update') {
          endpoint += `/${data.id}`;
          method = 'PUT';
        } else if (operation === 'delete') {
          endpoint += `/${data.id}`;
          method = 'DELETE';
          body = null;
        }
        break;

      case 'budget_items':
        endpoint = '/api/budget';
        if (operation === 'update') {
          endpoint += `/${data.id}`;
          method = 'PUT';
        } else if (operation === 'delete') {
          endpoint += `/${data.id}`;
          method = 'DELETE';
          body = null;
        }
        break;

      case 'photos':
        endpoint = '/api/photos';
        if (operation === 'delete') {
          endpoint += `/${data.id}`;
          method = 'DELETE';
          body = null;
        } else if (data.blob) {
          // Handle photo upload with FormData
          const formData = new FormData();
          formData.append('file', data.blob, 'photo.jpg');
          formData.append('category', data.category || '');
          formData.append('caption', data.caption || '');
          body = formData;
        }
        break;

      case 'messages':
        endpoint = '/api/messages';
        if (operation === 'update') {
          endpoint += `/${data.id}`;
          method = 'PUT';
        }
        break;

      default:
        throw new Error(`Unknown table: ${table}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local sync status
    if (table === 'vendors' && operation !== 'delete') {
      const vendor = await offlineDb['getVendors'](data.user_id);
      const vendorToUpdate = vendor.find(v => v.id === data.id);
      if (vendorToUpdate) {
        await offlineDb.saveVendor({
          ...vendorToUpdate,
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
      }
    }
  }

  private async syncFromServer() {
    try {
      // Get user profile to know which data to sync
      const profileResponse = await fetch('/api/user/profile');
      if (!profileResponse.ok) return;

      const profile = await profileResponse.json();
      const userId = profile.id;

      // Sync vendors
      const vendorsResponse = await fetch('/api/vendors');
      if (vendorsResponse.ok) {
        const vendors = await vendorsResponse.json();
        for (const vendor of vendors) {
          await offlineDb.saveVendor({
            ...vendor,
            sync_status: 'synced',
            last_synced: new Date().toISOString(),
          });
        }
      }

      // Sync budget items
      const budgetResponse = await fetch('/api/budget');
      if (budgetResponse.ok) {
        const budgetItems = await budgetResponse.json();
        for (const item of budgetItems) {
          await offlineDb.saveBudgetItem({
            ...item,
            sync_status: 'synced',
            last_synced: new Date().toISOString(),
          });
        }
      }

      // Sync photos metadata (not the actual images)
      const photosResponse = await fetch('/api/photos');
      if (photosResponse.ok) {
        const photos = await photosResponse.json();
        for (const photo of photos) {
          await offlineDb.savePhoto({
            ...photo,
            sync_status: 'synced',
            last_synced: new Date().toISOString(),
          });
        }
      }

      // Sync messages
      const messagesResponse = await fetch('/api/messages');
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        for (const message of messages) {
          await offlineDb.saveMessage({
            ...message,
            sync_status: 'synced',
            last_synced: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error syncing from server:', error);
    }
  }

  // Manual conflict resolution
  async resolveConflict(
    localData: any,
    serverData: any,
    resolution: 'local' | 'server'
  ): Promise<void> {
    if (resolution === 'local') {
      // Keep local version and sync to server
      // Add to sync queue to push local changes
    } else {
      // Keep server version and update local
      // Update local database with server data
    }
  }

  // Get sync status
  async getStatus() {
    return offlineDb.getSyncStatus();
  }

  // Force sync
  async forceSync() {
    this.syncInProgress = false;
    return this.sync();
  }

  // Clear all data and resync
  async clearAndResync() {
    await offlineDb.clearAllData();
    return this.syncFromServer();
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const syncManager = new OfflineSyncManager();