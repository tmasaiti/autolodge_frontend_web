import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SearchInterface } from '../components/search/SearchInterface';
import { VehicleList } from '../components/marketplace/VehicleList';
import { SearchFiltersPanel } from '../components/search/SearchFiltersPanel';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  mockVehicles, 
  mockSearchResults, 
  MockVehicle,
  delay 
} from '../data/mockData';
import { 
  Filter, 
  Grid, 
  List, 
  Map, 
  SlidersHorizontal,
  Search,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<MockVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    category: '',
    priceRange: [0, 200],
    features: [] as string[]
  });

  useEffect(() => {
    // Simulate search API call
    const performSearch = async () => {
      setLoading(true);
      await delay(800);
      
      // Filter vehicles based on search criteria
      let filteredVehicles = mockVehicles.filter(v => v.available);
      
      if (filters.location) {
        filteredVehicles = filteredVehicles.filter(v => 
          v.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          v.location.country.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredVehicles = filteredVehicles.filter(v => v.category === filters.category);
      }
      
      filteredVehicles = filteredVehicles.filter(v => 
        v.dailyRate >= filters.priceRange[0] && v.dailyRate <= filters.priceRange[1]
      );
      
      setVehicles(filteredVehicles);
      setLoading(false);
    };

    performSearch();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchInterface 
            initialLocation={filters.location}
            initialStartDate={filters.startDate}
            initialEndDate={filters.endDate}
            onSearch={handleFilterChange}
            compact={true}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    location: '',
                    startDate: '',
                    endDate: '',
                    category: '',
                    priceRange: [0, 200],
                    features: []
                  })}
                >
                  Clear All
                </Button>
              </div>
              <SearchFiltersPanel
                filters={filters}
                onFiltersChange={handleFilterChange}
                availableFilters={mockSearchResults.filters}
              />
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? 'Searching...' : `${vehicles.length} vehicles found`}
                </h2>
                {filters.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{filters.location}</span>
                  </div>
                )}
                {filters.startDate && filters.endDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{filters.startDate} - {filters.endDate}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Mobile filter toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                {/* View mode toggles */}
                <div className="hidden sm:flex border border-gray-300 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none border-r"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-r"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </Card>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <VehicleList 
                vehicles={vehicles} 
                viewMode={viewMode}
                onVehicleSelect={(vehicle) => {
                  // Navigate to vehicle detail page
                  window.location.href = `/vehicles/${vehicle.id}`;
                }}
              />
            ) : (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No vehicles found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more options.
                </p>
                <Button
                  onClick={() => setFilters({
                    location: '',
                    startDate: '',
                    endDate: '',
                    category: '',
                    priceRange: [0, 200],
                    features: []
                  })}
                >
                  Clear Filters
                </Button>
              </Card>
            )}

            {/* Popular Destinations */}
            {!loading && vehicles.length === 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Popular Destinations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Cape Town, South Africa', 'Johannesburg, South Africa', 'Windhoek, Namibia', 'Gaborone, Botswana', 'Lusaka, Zambia', 'Harare, Zimbabwe'].map((destination) => (
                    <Link
                      key={destination}
                      to={`/search?location=${encodeURIComponent(destination)}`}
                      className="block"
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                          <span className="font-medium text-gray-900">{destination}</span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}