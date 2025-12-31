import React, { useState, useEffect, useCallback } from 'react';
import { searchAnalyticsService } from '../../services/searchAnalyticsService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  Search, 
  MapPin, 
  Calendar,
  Users,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface SearchAnalytics {
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
    average_time_to_booking: number; // in minutes
    bounce_rate: number; // percentage of single-page searches
  };
  user_behavior: {
    average_filters_used: number;
    most_used_filters: Array<{
      filter_name: string;
      usage_count: number;
    }>;
    search_refinement_rate: number; // percentage of searches that are refined
  };
}

interface SearchAnalyticsProps {
  className?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  className = "",
  timeRange = 'month'
}) => {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await searchAnalyticsService.getSearchAnalytics(selectedTimeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  const handleExportData = useCallback(async () => {
    try {
      const exportData = await searchAnalyticsService.exportAnalytics(selectedTimeRange);
      
      // Create and download CSV file
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  }, [selectedTimeRange]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className={`search-analytics ${className}`}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`search-analytics ${className}`}>
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h4>
          <p className="text-gray-500">Analytics data will appear once users start searching.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`search-analytics ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Search Analytics</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as typeof selectedTimeRange)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last 12 months</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Searches</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(analytics.total_searches)}
              </p>
              <p className="text-xs text-green-600">
                +{formatNumber(analytics.searches_this_week)} this week
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Results</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.average_results_per_search.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">per search</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(analytics.conversion_metrics.searches_to_bookings)}
              </p>
              <p className="text-xs text-gray-500">searches to bookings</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Time to Book</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(analytics.conversion_metrics.average_time_to_booking)}
              </p>
              <p className="text-xs text-gray-500">average</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Popular Locations and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Popular Locations
          </h4>
          <div className="space-y-3">
            {analytics.most_popular_locations.slice(0, 5).map((location, index) => (
              <div key={location.location} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-4">
                    {index + 1}.
                  </span>
                  <span className="ml-2 text-gray-900">{location.location}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${location.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {formatPercentage(location.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Popular Categories
          </h4>
          <div className="space-y-3">
            {analytics.most_popular_categories.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-4">
                    {index + 1}.
                  </span>
                  <span className="ml-2 text-gray-900 capitalize">{category.category}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {formatPercentage(category.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* User Behavior Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Search Behavior</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Filters Used</span>
              <span className="font-medium">{analytics.user_behavior.average_filters_used.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Refinement Rate</span>
              <span className="font-medium">{formatPercentage(analytics.user_behavior.search_refinement_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bounce Rate</span>
              <span className="font-medium">{formatPercentage(analytics.conversion_metrics.bounce_rate)}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Most Used Filters</h4>
          <div className="space-y-2">
            {analytics.user_behavior.most_used_filters.slice(0, 4).map((filter, index) => (
              <div key={filter.filter_name} className="flex items-center justify-between">
                <span className="text-sm text-gray-900 capitalize">
                  {filter.filter_name.replace('_', ' ')}
                </span>
                <Badge variant="secondary" size="sm">
                  {formatNumber(filter.usage_count)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Peak Hours</h4>
          <div className="space-y-2">
            {analytics.peak_search_hours
              .sort((a, b) => b.search_count - a.search_count)
              .slice(0, 4)
              .map(hour => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">
                    {hour.hour}:00 - {hour.hour + 1}:00
                  </span>
                  <Badge variant="secondary" size="sm">
                    {formatNumber(hour.search_count)}
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Search Trends Chart Placeholder */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Search Trends
        </h4>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Chart visualization would be implemented here</p>
            <p className="text-sm text-gray-400">
              Showing {analytics.search_trends.length} data points over {selectedTimeRange}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};