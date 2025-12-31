/**
 * Custom hook for managing cross-border permits
 * Provides state management and operations for permit applications, renewals, and tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { permitService, PermitSearchFilters } from '../services/permitService';
import { 
  CrossBorderPermit, 
  PermitRequirement, 
  PermitApplication 
} from '../components/booking/CrossBorderPermitManagement';
import { SADCCountryCode } from '../schemas/common-schemas';

export interface UsePermitManagementOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: PermitSearchFilters;
}

export interface PermitStatistics {
  total_permits: number;
  active_permits: number;
  processing_permits: number;
  expired_permits: number;
  expiring_soon: number;
  success_rate: number;
  average_processing_days: number;
  total_fees_paid: number;
  currency: string;
}

export interface PermitNotification {
  id: string;
  permit_id: number;
  type: 'expiring_soon' | 'renewal_available' | 'status_update' | 'document_required';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read: boolean;
  action_required: boolean;
  action_url?: string;
}

export const usePermitManagement = (options: UsePermitManagementOptions = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    filters
  } = options;

  // State
  const [permits, setPermits] = useState<CrossBorderPermit[]>([]);
  const [permitRequirements, setPermitRequirements] = useState<PermitRequirement[]>([]);
  const [statistics, setStatistics] = useState<PermitStatistics | null>(null);
  const [notifications, setNotifications] = useState<PermitNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load permits
  const loadPermits = useCallback(async (searchFilters?: PermitSearchFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const permitData = await permitService.getPermits(searchFilters || filters);
      setPermits(permitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permits');
      console.error('Failed to load permits:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load permit requirements
  const loadPermitRequirements = useCallback(async (
    fromCountry: SADCCountryCode,
    toCountries: SADCCountryCode[]
  ) => {
    try {
      const requirements = await permitService.getPermitRequirements(fromCountry, toCountries);
      setPermitRequirements(requirements);
      return requirements;
    } catch (err) {
      console.error('Failed to load permit requirements:', err);
      throw err;
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await permitService.getPermitStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load permit statistics:', err);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const notificationData = await permitService.getPermitNotifications();
      setNotifications(notificationData);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadPermits(),
        loadStatistics(),
        loadNotifications()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPermits, loadStatistics, loadNotifications]);

  // Submit permit application
  const submitApplication = useCallback(async (application: PermitApplication): Promise<CrossBorderPermit> => {
    try {
      const newPermit = await permitService.submitApplication(application);
      
      // Update local state
      setPermits(prev => [...prev, newPermit]);
      
      // Refresh statistics
      loadStatistics();
      
      return newPermit;
    } catch (err) {
      console.error('Failed to submit permit application:', err);
      throw err;
    }
  }, [loadStatistics]);

  // Renew permit
  const renewPermit = useCallback(async (permitId: number): Promise<CrossBorderPermit> => {
    try {
      const renewedPermit = await permitService.renewPermit({
        permit_id: permitId,
        new_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      });
      
      // Update local state
      setPermits(prev => prev.map(p => p.id === permitId ? renewedPermit : p));
      
      return renewedPermit;
    } catch (err) {
      console.error('Failed to renew permit:', err);
      throw err;
    }
  }, []);

  // Cancel permit
  const cancelPermit = useCallback(async (permitId: number, reason?: string): Promise<void> => {
    try {
      await permitService.cancelPermit(permitId, reason);
      
      // Update local state
      setPermits(prev => prev.map(p => 
        p.id === permitId ? { ...p, status: 'cancelled' as const } : p
      ));
    } catch (err) {
      console.error('Failed to cancel permit:', err);
      throw err;
    }
  }, []);

  // Refresh permit status
  const refreshPermitStatus = useCallback(async (permitId: number): Promise<CrossBorderPermit> => {
    try {
      const updatedPermit = await permitService.refreshPermitStatus(permitId);
      
      // Update local state
      setPermits(prev => prev.map(p => p.id === permitId ? updatedPermit : p));
      
      return updatedPermit;
    } catch (err) {
      console.error('Failed to refresh permit status:', err);
      throw err;
    }
  }, []);

  // Upload document
  const uploadDocument = useCallback(async (
    file: File,
    permitId: string,
    documentType: string
  ): Promise<string> => {
    try {
      const response = await permitService.uploadDocument(
        parseInt(permitId),
        file,
        documentType
      );
      
      // Update local state with document URL
      setPermits(prev => prev.map(p => 
        p.id?.toString() === permitId 
          ? { ...p, document_url: response.document_url }
          : p
      ));
      
      return response.document_url;
    } catch (err) {
      console.error('Failed to upload document:', err);
      throw err;
    }
  }, []);

  // View document
  const viewDocument = useCallback((documentUrl: string) => {
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Check route requirements
  const checkRouteRequirements = useCallback(async (
    fromCountry: SADCCountryCode,
    toCountries: SADCCountryCode[],
    vehicleType: string,
    travelDates: { start_date: string; end_date: string }
  ) => {
    try {
      return await permitService.checkRouteRequirements(
        fromCountry,
        toCountries,
        vehicleType,
        travelDates
      );
    } catch (err) {
      console.error('Failed to check route requirements:', err);
      throw err;
    }
  }, []);

  // Get border crossing points
  const getBorderCrossingPoints = useCallback(async (
    fromCountry: SADCCountryCode,
    toCountry: SADCCountryCode
  ) => {
    try {
      return await permitService.getBorderCrossingPoints(fromCountry, toCountry);
    } catch (err) {
      console.error('Failed to get border crossing points:', err);
      throw err;
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await permitService.markNotificationRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Get permits by status
  const getPermitsByStatus = useCallback((status: CrossBorderPermit['status'][]) => {
    return permits.filter(permit => status.includes(permit.status));
  }, [permits]);

  // Get expiring permits
  const getExpiringPermits = useCallback((daysFromNow: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysFromNow);
    
    return permits.filter(permit => {
      if (!permit.expiry_date || permit.status !== 'issued') return false;
      const expiryDate = new Date(permit.expiry_date);
      return expiryDate <= cutoffDate && expiryDate > new Date();
    });
  }, [permits]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Get high priority notifications
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(n => ['high', 'urgent'].includes(n.priority));
  }, [notifications]);

  // Initial load
  useEffect(() => {
    loadPermits();
    loadStatistics();
    loadNotifications();
  }, [loadPermits, loadStatistics, loadNotifications]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  return {
    // State
    permits,
    permitRequirements,
    statistics,
    notifications,
    loading,
    error,
    refreshing,

    // Actions
    loadPermits,
    loadPermitRequirements,
    refreshData,
    submitApplication,
    renewPermit,
    cancelPermit,
    refreshPermitStatus,
    uploadDocument,
    viewDocument,
    checkRouteRequirements,
    getBorderCrossingPoints,
    markNotificationRead,

    // Computed values
    activePermits: getPermitsByStatus(['issued', 'processing', 'pending']),
    expiredPermits: getPermitsByStatus(['expired', 'rejected', 'cancelled']),
    draftApplications: getPermitsByStatus(['draft']),
    expiringPermits: getExpiringPermits(),
    unreadNotifications: getUnreadNotifications(),
    highPriorityNotifications: getHighPriorityNotifications(),

    // Utility functions
    getPermitsByStatus,
    getExpiringPermits,
    getUnreadNotifications,
    getHighPriorityNotifications
  };
};