import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import { toast } from 'sonner';

interface UseOfflineDataOptions {
  autoSync?: boolean;
  syncOnMount?: boolean;
  syncOnChange?: boolean;
}

export function useOfflineData<T>(
  dataType: 'vendors' | 'budget_items' | 'photos' | 'messages',
  userId: string,
  options: UseOfflineDataOptions = {}
) {
  const {
    autoSync = true,
    syncOnMount = true,
    syncOnChange = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    errors: 0,
  });

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      let items: any[] = [];
      
      switch (dataType) {
        case 'vendors':
          items = await offlineDb.getVendors(userId);
          break;
        case 'budget_items':
          items = await offlineDb.getBudgetItems(userId);
          break;
        case 'photos':
          items = await offlineDb.getPhotos(userId);
          break;
        case 'messages':
          items = await offlineDb.getMessages(userId);
          break;
      }
      
      setData(items as T[]);
    } catch (error) {
      console.error('Failed to load offline data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dataType, userId]);

  // Sync data with server
  const sync = useCallback(async () => {
    if (!isOnline || !autoSync) return;

    try {
      const result = await syncManager.sync();
      
      if (result.failed > 0) {
        toast.warning(`${result.failed} items failed to sync`);
      } else if (result.synced > 0) {
        toast.success(`Synced ${result.synced} items`);
      }
      
      // Reload data after sync
      await loadData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [isOnline, autoSync, loadData]);

  // Add or update item
  const saveItem = useCallback(async (item: any) => {
    try {
      switch (dataType) {
        case 'vendors':
          await offlineDb.saveVendor(item);
          break;
        case 'budget_items':
          await offlineDb.saveBudgetItem(item);
          break;
        case 'photos':
          await offlineDb.savePhoto(item);
          break;
        case 'messages':
          await offlineDb.saveMessage(item);
          break;
      }
      
      await loadData();
      
      if (syncOnChange && isOnline) {
        sync();
      } else if (!isOnline) {
        toast.info('Changes saved offline');
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('Failed to save changes');
    }
  }, [dataType, loadData, syncOnChange, isOnline, sync]);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    try {
      switch (dataType) {
        case 'vendors':
          await offlineDb.deleteVendor(id);
          break;
        case 'budget_items':
          await offlineDb.deleteBudgetItem(id);
          break;
        case 'photos':
          await offlineDb.deletePhoto(id);
          break;
        default:
          throw new Error('Delete not supported for this data type');
      }
      
      await loadData();
      
      if (syncOnChange && isOnline) {
        sync();
      } else if (!isOnline) {
        toast.info('Deletion saved offline');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete');
    }
  }, [dataType, loadData, syncOnChange, isOnline, sync]);

  // Get items by filter
  const getByFilter = useCallback(async (filter: { key: string; value: any }) => {
    try {
      let items: any[] = [];
      
      switch (dataType) {
        case 'vendors':
          if (filter.key === 'category') {
            items = await offlineDb.getVendorsByCategory(filter.value);
          }
          break;
        case 'photos':
          if (filter.key === 'category') {
            items = await offlineDb.getPhotosByCategory(filter.value);
          }
          break;
      }
      
      return items as T[];
    } catch (error) {
      console.error('Failed to filter data:', error);
      return [];
    }
  }, [dataType]);

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    const status = await offlineDb.getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Setup effect
  useEffect(() => {
    // Initial load
    loadData();
    
    // Initial sync
    if (syncOnMount && isOnline) {
      sync();
    }
    
    // Update sync status
    updateSyncStatus();
    const statusInterval = setInterval(updateSyncStatus, 5000);
    
    // Online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData, sync, syncOnMount, updateSyncStatus]);

  return {
    data,
    loading,
    isOnline,
    syncStatus,
    saveItem,
    deleteItem,
    getByFilter,
    sync,
    refresh: loadData,
  };
}

// Specific hooks for each data type
export function useOfflineVendors(userId: string, options?: UseOfflineDataOptions) {
  return useOfflineData<any>('vendors', userId, options);
}

export function useOfflineBudget(userId: string, options?: UseOfflineDataOptions) {
  return useOfflineData<any>('budget_items', userId, options);
}

export function useOfflinePhotos(userId: string, options?: UseOfflineDataOptions) {
  return useOfflineData<any>('photos', userId, options);
}

export function useOfflineMessages(userId: string, options?: UseOfflineDataOptions) {
  return useOfflineData<any>('messages', userId, options);
}