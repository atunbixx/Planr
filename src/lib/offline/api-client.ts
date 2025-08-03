import { offlineDb } from './db';
import { toast } from 'sonner';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  offline?: boolean;
}

interface OfflineResponse<T = any> {
  data?: T;
  error?: string;
  offline: boolean;
  queued?: boolean;
}

export class OfflineApiClient {
  private baseUrl: string;
  private isOnline: boolean = navigator.onLine;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<OfflineResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', headers = {}, body, offline = true } = options;

    // Try online request first
    if (this.isOnline) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { data, offline: false };
      } catch (error) {
        console.error('Online request failed:', error);
        
        // Fall through to offline handling
        if (!offline) {
          return { error: 'Request failed', offline: false };
        }
      }
    }

    // Handle offline scenarios
    return this.handleOfflineRequest(endpoint, method, body);
  }

  private async handleOfflineRequest<T = any>(
    endpoint: string,
    method: string,
    body: any
  ): Promise<OfflineResponse<T>> {
    // GET requests - return cached data
    if (method === 'GET') {
      const data = await this.getCachedData(endpoint);
      if (data) {
        return { data, offline: true };
      }
      return { 
        error: 'No cached data available', 
        offline: true 
      };
    }

    // Mutation requests - queue for sync
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      await this.queueMutation(endpoint, method, body);
      toast.info('Changes saved offline and will sync when online');
      return { 
        data: body, 
        offline: true, 
        queued: true 
      };
    }

    return { 
      error: 'Operation not supported offline', 
      offline: true 
    };
  }

  private async getCachedData(endpoint: string): Promise<any> {
    try {
      // Map endpoints to IndexedDB queries
      if (endpoint.includes('/api/vendors')) {
        const userId = this.extractUserId();
        return await offlineDb.getVendors(userId);
      }
      
      if (endpoint.includes('/api/budget')) {
        const userId = this.extractUserId();
        return await offlineDb.getBudgetItems(userId);
      }
      
      if (endpoint.includes('/api/photos')) {
        const userId = this.extractUserId();
        return await offlineDb.getPhotos(userId);
      }
      
      if (endpoint.includes('/api/messages')) {
        const userId = this.extractUserId();
        return await offlineDb.getMessages(userId);
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  private async queueMutation(endpoint: string, method: string, data: any) {
    const table = this.getTableFromEndpoint(endpoint);
    const operation = this.getOperationFromMethod(method);
    
    if (table) {
      // Add to sync queue via appropriate offline method
      switch (table) {
        case 'vendors':
          if (operation === 'delete') {
            await offlineDb.deleteVendor(data.id);
          } else {
            await offlineDb.saveVendor(data);
          }
          break;
        case 'budget_items':
          if (operation === 'delete') {
            await offlineDb.deleteBudgetItem(data.id);
          } else {
            await offlineDb.saveBudgetItem(data);
          }
          break;
        case 'photos':
          if (operation === 'delete') {
            await offlineDb.deletePhoto(data.id);
          } else {
            await offlineDb.savePhoto(data);
          }
          break;
        case 'messages':
          await offlineDb.saveMessage(data);
          break;
      }
    }
  }

  private getTableFromEndpoint(endpoint: string): string | null {
    if (endpoint.includes('/vendors')) return 'vendors';
    if (endpoint.includes('/budget')) return 'budget_items';
    if (endpoint.includes('/photos')) return 'photos';
    if (endpoint.includes('/messages')) return 'messages';
    return null;
  }

  private getOperationFromMethod(method: string): 'create' | 'update' | 'delete' {
    switch (method) {
      case 'POST': return 'create';
      case 'PUT': return 'update';
      case 'DELETE': return 'delete';
      default: return 'update';
    }
  }

  private extractUserId(): string {
    // This would typically come from auth context or session
    // For now, return a placeholder
    return 'current-user-id';
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<OfflineResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data: any): Promise<OfflineResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data: any): Promise<OfflineResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  async delete<T = any>(endpoint: string): Promise<OfflineResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const offlineApi = new OfflineApiClient('/api');