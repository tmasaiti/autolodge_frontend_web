import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { searchSlice, SearchParams, SearchFilters } from '../../store/slices/searchSlice';
import { LocationAutocomplete } from './LocationAutocomplete';
import { SearchFiltersPanel } from './SearchFiltersPanel';
import { VehicleList } from '../marketplace/VehicleList';
import { vehicleService } from '../../services/vehicleService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, MapPin, Filter, Search } from 'lucide-react';
import { debounce } from '../../utils/debounce';

interface SearchInterfaceProps {
  className?: string;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { currentSearch, searchResults, loading, error, totalResults, hasMore } = useSelector(
    (state: RootState) => state.search
  );

  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState<Partial<SearchParams>>({
    location: undefined,
    date_range: {
      start_date: '',
      end_date: ''
    },
    filters: {},
    sort_by: 'distance',
    radius_km: 50
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchParams: SearchParams) => {
      try {
        dispatch(searchSlice.actions.setLoading(true));
        const results = await vehicleService.searchVehicles(searchParams);
        dispatch(searchSlice.actions.setSearchResults(results));
        dispatch(searchSlice.actions.setCurrentSearch(searchParams));
      } catch (error) {
        dispatch(searchSlice.actions.setError(error instanceof Error ? error.message : 'Search failed'));
      }
    }, 500),
    [dispatch]
  );

  // Handle search execution
  const handleSearch = useCallback(() => {
    if (!localSearch.location || !localSearch.date_range?.start_date || !localSearch.date_range?.end_date) {
      return;
    }

    const searchParams: SearchParams = {
      location: localSearch.location,
      date_range: localSearch.date_range,
      filters: localSearch.filters || {},
      sort_by: localSearch.sort_by || 'distance',
      radius_km: localSearch.radius_km || 50
    };

    debouncedSearch(searchParams);
  }, [localSearch, debouncedSearch]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: SearchParams['location']) => {
    setLocalSearch(prev => ({ ...prev, location }));
  }, []);

  // Handle date changes
  const handleDateChange = useCallback((field: 'start_date' | 'end_date', value: string) => {
    setLocalSearch(prev => ({
      ...prev,
      date_range: {
        ...prev.date_range!,
        [field]: value
      }
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: SearchFilters) => {
    setLocalSearch(prev => ({ ...prev, filters }));
    
    // Auto-search when filters change if we have a valid search
    if (localSearch.location && localSearch.date_range?.start_date && localSearch.date_range?.end_date) {
      const searchParams: SearchParams = {
        location: localSearch.location,
        date_range: localSearch.date_range,
        filters,
        sort_by: localSearch.sort_by || 'distance',
        radius_km: localSearch.radius_km || 50
      };
      debouncedSearch(searchParams);
    }
  }, [localSearch, debouncedSearch]);

  // Handle sort change
  const handleSortChange = useCallback((sort_by: SearchParams['sort_by']) => {
    setLocalSearch(prev => ({ ...prev, sort_by }));
    
    if (currentSearch) {
      const updatedSearch = { ...currentSearch, sort_by };
      debouncedSearch(updatedSearch);
    }
  }, [currentSearch, debouncedSearch]);

  // Load more results
  const handleLoadMore = useCallback(async () => {
    if (!currentSearch || !hasMore || loading) return;

    try {
      dispatch(searchSlice.actions.setLoading(true));
      const results = await vehicleService.searchVehicles({
        ...currentSearch,
        // Add pagination offset based on current results length
      });
      dispatch(searchSlice.actions.appendSearchResults(results));
    } catch (error) {
      dispatch(searchSlice.actions.setError(error instanceof Error ? error.message : 'Failed to load more results'));
    }
  }, [currentSearch, hasMore, loading, dispatch]);

  return (
    <div className={`search-interface ${className}`}>
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Location Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Where do you want to pick up?
              </label>
              <LocationAutocomplete
                onLocationSelect={handleLocationSelect}
                placeholder="Enter city, airport, or address"
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Pick-up Date
                </label>
                <Input
                  type="date"
                  value={localSearch.date_range?.start_date || ''}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Date
                </label>
                <Input
                  type="date"
                  value={localSearch.date_range?.end_date || ''}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                  min={localSearch.date_range?.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!localSearch.location || !localSearch.date_range?.start_date || !localSearch.date_range?.end_date}
                className="px-8 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Search Summary */}
          {currentSearch && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {totalResults} vehicles found in {currentSearch.location.city}
                {currentSearch.date_range.start_date && currentSearch.date_range.end_date && (
                  <span> from {new Date(currentSearch.date_range.start_date).toLocaleDateString()} to {new Date(currentSearch.date_range.end_date).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={currentSearch.sort_by}
                  onChange={(e) => handleSortChange(e.target.value as SearchParams['sort_by'])}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="price">Sort by Price</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="availability">Sort by Availability</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <SearchFiltersPanel
                filters={localSearch.filters || {}}
                onFiltersChange={handleFilterChange}
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {currentSearch && (
              <VehicleList
                vehicles={searchResults.map(result => ({
                  id: result.vehicle_id,
                  distance_km: result.distance_km,
                  daily_rate: result.daily_rate,
                  currency: result.currency,
                  operator_rating: result.operator_rating
                }))}
                viewMode="grid"
                onVehicleSelect={(vehicle) => {
                  // Navigate to vehicle detail page
                  window.location.href = `/vehicles/${vehicle.id}`;
                }}
                onFilterChange={handleFilterChange}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                filters={localSearch.filters}
              />
            )}

            {!currentSearch && !loading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
                <p className="text-gray-500">Enter your location and travel dates to find available vehicles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};