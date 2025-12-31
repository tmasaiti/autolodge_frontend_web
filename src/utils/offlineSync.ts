// Offline data synchronization utilities

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  data?: any;
}

class OfflineSyncManager {
  private dbName = 'autolodge-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadSyncQueue();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('userActions')) {
          const actionsStore = db.createObjectStore('userActions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Background sync registration
    if ('serviceWorker' in navigator && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        // Check if sync is supported
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          return (registration as any).sync.register('background-sync');
        }
      });
    }
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => {
      this.syncQueue = request.result || [];
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    };
  }

  async addToSyncQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3
    };

    this.syncQueue.push(offlineAction);

    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.add(offlineAction);
    }

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToProcess = [...this.syncQueue];
      
      for (const action of actionsToProcess) {
        try {
          const result = await this.syncAction(action);
          
          if (result.success) {
            await this.removeFromSyncQueue(action.id);
          } else {
            await this.handleSyncFailure(action, result.error);
          }
        } catch (error) {
          await this.handleSyncFailure(action, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncAction(action: OfflineAction): Promise<SyncResult> {
    try {
      let result: SyncResult;

      switch (action.type) {
        case 'CREATE_BOOKING':
          result = await this.syncCreateBooking(action.payload);
          break;
        case 'UPDATE_PROFILE':
          result = await this.syncUpdateProfile(action.payload);
          break;
        case 'SEND_MESSAGE':
          result = await this.syncSendMessage(action.payload);
          break;
        case 'SUBMIT_REVIEW':
          result = await this.syncSubmitReview(action.payload);
          break;
        default:
          result = { success: false, error: `Unknown action type: ${action.type}` };
      }

      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  }

  private async syncCreateBooking(payload: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async syncUpdateProfile(payload: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async syncSendMessage(payload: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async syncSubmitReview(payload: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async handleSyncFailure(action: OfflineAction, error?: string): Promise<void> {
    action.retryCount++;

    if (action.retryCount >= action.maxRetries) {
      console.error(`Max retries reached for action ${action.id}:`, error);
      await this.removeFromSyncQueue(action.id);
      // Optionally notify user of permanent failure
    } else {
      // Update the action in the database with new retry count
      if (this.db) {
        const transaction = this.db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        store.put(action);
      }
    }
  }

  private async removeFromSyncQueue(actionId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId);

    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.delete(actionId);
    }
  }

  // Cache management
  async cacheData(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    store.put(cacheEntry);
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        
        if (result) {
          const age = Date.now() - result.timestamp;
          if (age < result.ttl) {
            resolve(result.data);
          } else {
            // Data is stale, remove it
            this.removeCachedData(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  async removeCachedData(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    store.delete(key);
  }

  // Get sync queue status
  getSyncQueueStatus(): { pending: number; isOnline: boolean; syncInProgress: boolean } {
    return {
      pending: this.syncQueue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();

// React hook for offline sync
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = React.useState(offlineSyncManager.getSyncQueueStatus());

  React.useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(offlineSyncManager.getSyncQueueStatus());
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);

    // Update on network status change
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addAction = React.useCallback(async (
    type: string,
    payload: any,
    maxRetries: number = 3
  ) => {
    await offlineSyncManager.addToSyncQueue({ type, payload, maxRetries });
    setSyncStatus(offlineSyncManager.getSyncQueueStatus());
  }, []);

  const forceSync = React.useCallback(async () => {
    await offlineSyncManager.forcSync();
    setSyncStatus(offlineSyncManager.getSyncQueueStatus());
  }, []);

  return {
    syncStatus,
    addAction,
    forceSync
  };
}

// Import React for hooks
import React from 'react';