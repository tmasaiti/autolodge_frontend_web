import { api } from './api';

export interface SearchAlert {
  id: number;
  saved_search_id: number;
  saved_search_name: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  channels: ('email' | 'sms' | 'push')[];
  last_triggered: string | null;
  next_check: string;
  is_active: boolean;
  match_count_since_last: number;
  created_at: string;
}

export interface AlertPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_alerts_per_day: number;
}

export interface CreateSearchAlertRequest {
  saved_search_id: number;
  frequency: SearchAlert['frequency'];
  channels: SearchAlert['channels'];
}

export interface UpdateSearchAlertRequest {
  frequency?: SearchAlert['frequency'];
  channels?: SearchAlert['channels'];
  is_active?: boolean;
}

export const searchAlertService = {
  // Get all search alerts for the current user
  getSearchAlerts: async (): Promise<SearchAlert[]> => {
    const response = await api.get<SearchAlert[]>('/search-alerts');
    return response.data;
  },

  // Create a new search alert
  createSearchAlert: async (data: CreateSearchAlertRequest): Promise<SearchAlert> => {
    const response = await api.post<SearchAlert>('/search-alerts', data);
    return response.data;
  },

  // Update an existing search alert
  updateSearchAlert: async (id: number, data: UpdateSearchAlertRequest): Promise<SearchAlert> => {
    const response = await api.put<SearchAlert>(`/search-alerts/${id}`, data);
    return response.data;
  },

  // Delete a search alert
  deleteSearchAlert: async (id: number): Promise<void> => {
    await api.delete(`/search-alerts/${id}`);
  },

  // Get alert preferences
  getAlertPreferences: async (): Promise<AlertPreferences> => {
    const response = await api.get<AlertPreferences>('/search-alerts/preferences');
    return response.data;
  },

  // Update alert preferences
  updateAlertPreferences: async (preferences: AlertPreferences): Promise<AlertPreferences> => {
    const response = await api.put<AlertPreferences>('/search-alerts/preferences', preferences);
    return response.data;
  },

  // Test alert delivery (for debugging)
  testAlert: async (alertId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/search-alerts/${alertId}/test`);
    return response.data;
  },

  // Get alert history
  getAlertHistory: async (alertId?: number, limit = 50): Promise<Array<{
    id: number;
    alert_id: number;
    triggered_at: string;
    matches_found: number;
    notification_sent: boolean;
    channels_used: string[];
  }>> => {
    const params = new URLSearchParams();
    if (alertId) params.append('alert_id', alertId.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`/search-alerts/history?${params}`);
    return response.data;
  },

  // Pause all alerts (vacation mode)
  pauseAllAlerts: async (): Promise<{ paused_count: number }> => {
    const response = await api.post<{ paused_count: number }>('/search-alerts/pause-all');
    return response.data;
  },

  // Resume all alerts
  resumeAllAlerts: async (): Promise<{ resumed_count: number }> => {
    const response = await api.post<{ resumed_count: number }>('/search-alerts/resume-all');
    return response.data;
  },

  // Get alert statistics
  getAlertStats: async (): Promise<{
    total_alerts: number;
    active_alerts: number;
    alerts_triggered_today: number;
    alerts_triggered_this_week: number;
    average_matches_per_alert: number;
  }> => {
    const response = await api.get('/search-alerts/stats');
    return response.data;
  }
};