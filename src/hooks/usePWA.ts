import { useState, useEffect, useCallback } from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: PWAInstallPrompt | null;
}

export interface PWAActions {
  install: () => Promise<void>;
  updateApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running in iOS Safari standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Register service worker and handle updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setIsUpdateAvailable(true);
        }
      });
    }
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      throw error;
    }
  }, [installPrompt]);

  const updateApp = useCallback(async () => {
    if (!registration || !registration.waiting) {
      throw new Error('No update available');
    }

    try {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to become active
      await new Promise<void>((resolve) => {
        const handleStateChange = () => {
          if (registration.active) {
            registration.removeEventListener('updatefound', handleStateChange);
            resolve();
          }
        };
        registration.addEventListener('updatefound', handleStateChange);
      });

      // Reload the page to use the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }, [registration]);

  const dismissInstallPrompt = useCallback(() => {
    setInstallPrompt(null);
    setIsInstallable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    installPrompt,
    install,
    updateApp,
    dismissInstallPrompt,
  };
}

// Hook for managing offline data
export function useOfflineData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnReconnect?: boolean;
  } = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 24 * 60 * 60 * 1000, // 24 hours
    refetchOnReconnect = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const { isOnline } = usePWA();

  const getCachedData = useCallback(async (): Promise<{ data: T; timestamp: number } | null> => {
    try {
      const cached = localStorage.getItem(`offline_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        if (age < cacheTime) {
          return parsed;
        } else {
          localStorage.removeItem(`offline_${key}`);
        }
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    return null;
  }, [key, cacheTime]);

  const setCachedData = useCallback((data: T) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, [key]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = await getCachedData();
    
    // Use cached data if available and not stale (unless force refresh)
    if (cached && !forceRefresh) {
      const age = Date.now() - cached.timestamp;
      if (age < staleTime) {
        setData(cached.data);
        setLastFetch(cached.timestamp);
        return cached.data;
      }
    }

    // If offline, use cached data if available
    if (!isOnline && cached) {
      setData(cached.data);
      setLastFetch(cached.timestamp);
      return cached.data;
    }

    // Fetch fresh data if online
    if (isOnline) {
      setIsLoading(true);
      setError(null);
      
      try {
        const freshData = await fetchFn();
        setData(freshData);
        setCachedData(freshData);
        setLastFetch(Date.now());
        return freshData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Fetch failed');
        setError(error);
        
        // Fallback to cached data if fetch fails
        if (cached) {
          setData(cached.data);
          setLastFetch(cached.timestamp);
          return cached.data;
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    }

    // If no cached data and offline, throw error
    throw new Error('No data available offline');
  }, [fetchFn, getCachedData, setCachedData, isOnline, staleTime]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && refetchOnReconnect && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age > staleTime) {
        fetchData();
      }
    }
  }, [isOnline, refetchOnReconnect, lastFetch, staleTime, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
    isStale: lastFetch ? Date.now() - lastFetch > staleTime : false,
    isCached: !isOnline && data !== null,
  };
}