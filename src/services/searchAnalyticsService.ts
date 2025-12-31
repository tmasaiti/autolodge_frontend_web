import { api } from './api';

export interface SearchAnalytics {
  total_searches: number;
  searches_this_week: number;
  searches_this_month: number;
  average_results_per_search: number;
  most_popular_locations: Array<{
    location: string;
    search_count: number;
    percentage: number;
  }>;
  most_popular_categories: Array<{
    category: string;
    search_count: number;
    percentage: number;
  }>;
  search_trends: Array<{
    date: string;
    search_count: number;
    unique_users: number;
  }>;
  peak_search_hours: Array<{
    hour: number;
    search_count: number;
  }>;
  conversion_metrics: {
    searches_to_bookings: number;
    average_time_to_booking: number;
    bounce_rate: number;
  };
  user_behavior: {
    average_filters_used: number;
    most_used_filters: Array<{
      filter_name: string;
      usage_count: number;
    }>;
    search_refinement_rate: number;
  };
}

export interface SearchEvent {
  id: number;
  user_id?: number;
  session_id: string;
  search_query: any;
  results_count: number;
  filters_used: string[];
  location: string;
  timestamp: string;
  user_agent: string;
  ip_address: string;
}

export interface SearchConversion {
  search_id: number;
  booking_id: number;
  time_to_conversion: number; // minutes
  conversion_type: 'booking' | 'inquiry' | 'favorite';
  created_at: string;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export const searchAnalyticsService = {
  // Get comprehensive search analytics
  getSearchAnalytics: async (timeRange: TimeRange = 'month'): Promise<SearchAnalytics> => {
    const response = await api.get<SearchAnalytics>(`/analytics/search?timeRange=${timeRange}`);
    return response.data;
  },

  // Track a search event
  trackSearchEvent: async (searchData: {
    query: any;
    results_count: number;
    filters_used: string[];
    location: string;
  }): Promise<{ event_id: number }> => {
    const response = await api.post<{ event_id: number }>('/analytics/search/track', searchData);
    return response.data;
  },

  // Track search conversion (when search leads to booking)
  trackSearchConversion: async (conversionData: {
    search_event_id: number;
    booking_id: number;
    conversion_type: SearchConversion['conversion_type'];
  }): Promise<void> => {
    await api.post('/analytics/search/conversion', conversionData);
  },

  // Get search trends over time
  getSearchTrends: async (timeRange: TimeRange = 'month'): Promise<Array<{
    date: string;
    search_count: number;
    unique_users: number;
    conversion_rate: number;
  }>> => {
    const response = await api.get(`/analytics/search/trends?timeRange=${timeRange}`);
    return response.data;
  },

  // Get popular search terms
  getPopularSearchTerms: async (limit = 20): Promise<Array<{
    term: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>> => {
    const response = await api.get(`/analytics/search/popular-terms?limit=${limit}`);
    return response.data;
  },

  // Get search performance by location
  getLocationAnalytics: async (): Promise<Array<{
    location: string;
    search_count: number;
    average_results: number;
    conversion_rate: number;
    top_categories: string[];
  }>> => {
    const response = await api.get('/analytics/search/locations');
    return response.data;
  },

  // Get filter usage analytics
  getFilterAnalytics: async (): Promise<Array<{
    filter_name: string;
    usage_count: number;
    usage_percentage: number;
    impact_on_results: number; // average change in result count
    conversion_impact: number; // impact on conversion rate
  }>> => {
    const response = await api.get('/analytics/search/filters');
    return response.data;
  },

  // Get user search behavior patterns
  getUserBehaviorAnalytics: async (): Promise<{
    average_searches_per_session: number;
    average_session_duration: number;
    search_abandonment_rate: number;
    refinement_patterns: Array<{
      from_filter: string;
      to_filter: string;
      frequency: number;
    }>;
    bounce_rate_by_results_count: Array<{
      results_range: string;
      bounce_rate: number;
    }>;
  }> => {
    const response = await api.get('/analytics/search/user-behavior');
    return response.data;
  },

  // Get search performance metrics
  getSearchPerformance: async (): Promise<{
    average_response_time: number;
    search_success_rate: number;
    error_rate: number;
    cache_hit_rate: number;
    peak_load_times: Array<{
      hour: number;
      requests_per_minute: number;
    }>;
  }> => {
    const response = await api.get('/analytics/search/performance');
    return response.data;
  },

  // Export analytics data
  exportAnalytics: async (
    timeRange: TimeRange = 'month',
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> => {
    const response = await api.get(
      `/analytics/search/export?timeRange=${timeRange}&format=${format}`,
      { responseType: 'text' }
    );
    return response.data;
  },

  // Get real-time search metrics
  getRealTimeMetrics: async (): Promise<{
    active_searches: number;
    searches_last_hour: number;
    average_results_last_hour: number;
    top_locations_last_hour: Array<{
      location: string;
      count: number;
    }>;
    system_load: {
      cpu_usage: number;
      memory_usage: number;
      response_time: number;
    };
  }> => {
    const response = await api.get('/analytics/search/real-time');
    return response.data;
  },

  // Get search funnel analytics
  getSearchFunnel: async (timeRange: TimeRange = 'month'): Promise<{
    total_visitors: number;
    search_initiated: number;
    results_viewed: number;
    vehicle_clicked: number;
    booking_started: number;
    booking_completed: number;
    conversion_rates: {
      visitor_to_search: number;
      search_to_view: number;
      view_to_click: number;
      click_to_booking: number;
      booking_to_completion: number;
    };
  }> => {
    const response = await api.get(`/analytics/search/funnel?timeRange=${timeRange}`);
    return response.data;
  }
};