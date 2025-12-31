import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Grid } from '../ui';
import { BookingPricing, BookingLocations, BookingTimelineEvent } from '../../schemas/booking-schemas';
import { VehicleSpecifications } from '../../schemas/vehicle-schemas';
import { Calendar, MapPin, Clock, Car, Filter, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../../utils/cn';

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'payment_pending' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export interface BookingData {
  id: number;
  renter_id: number;
  vehicle_id: number;
  operator_id: number;
  status: BookingStatus;
  date_range: {
    start_date: string;
    end_date: string;
    actual_start_date?: string;
    actual_end_date?: string;
  };
  locations: BookingLocations;
  pricing: BookingPricing;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    category: string;
    specifications: VehicleSpecifications;
    photos: Array<{ url: string; is_primary: boolean }>;
  };
  operator: {
    id: number;
    name: string;
    rating?: number;
  };
  timeline: BookingTimelineEvent[];
  created_at: string;
  updated_at: string;
}

export interface BookingListProps {
  bookings: BookingData[];
  filterStatus: BookingStatus[];
  onBookingSelect: (booking: BookingData) => void;
  onStatusFilterChange: (statuses: BookingStatus[]) => void;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
}

const statusConfig: Record<BookingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  payment_pending: { label: 'Payment Pending', variant: 'warning' },
  active: { label: 'Active', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  disputed: { label: 'Disputed', variant: 'error' }
};

// Helper functions
const formatDateRange = (dateRange: BookingData['date_range']) => {
  const start = format(parseISO(dateRange.start_date), 'MMM dd');
  const end = format(parseISO(dateRange.end_date), 'MMM dd, yyyy');
  const days = differenceInDays(parseISO(dateRange.end_date), parseISO(dateRange.start_date));
  return `${start} - ${end} (${days} days)`;
};

const getPrimaryPhoto = (photos: Array<{ url: string; is_primary: boolean }>) => {
  const primary = photos.find(p => p.is_primary);
  return primary?.url || photos[0]?.url || '/placeholder-vehicle.jpg';
};

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  filterStatus,
  onBookingSelect,
  onStatusFilterChange,
  loading = false,
  viewMode = 'list',
  showFilters = true
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;
    
    // Apply status filter
    if (filterStatus.length > 0) {
      filtered = bookings.filter(booking => filterStatus.includes(booking.status));
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date_range.start_date).getTime() - new Date(b.date_range.start_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'price':
          comparison = a.pricing.total_amount - b.pricing.total_amount;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [bookings, filterStatus, sortBy, sortOrder]);

  const handleStatusToggle = (status: BookingStatus) => {
    const newStatuses = filterStatus.includes(status)
      ? filterStatus.filter(s => s !== status)
      : [...filterStatus, status];
    onStatusFilterChange(newStatuses);
  };

  const getPrimaryPhoto = (photos: Array<{ url: string; is_primary: boolean }>) => {
    const primary = photos.find(p => p.is_primary);
    return primary?.url || photos[0]?.url || '/placeholder-vehicle.jpg';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingCardSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter by status:
            </span>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status as BookingStatus)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterStatus.includes(status as BookingStatus)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'status' | 'price');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="status-asc">Status A-Z</option>
              <option value="price-desc">Price High-Low</option>
              <option value="price-asc">Price Low-High</option>
            </select>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {viewMode === 'grid' ? (
        <Grid cols={1} responsive={{ md: 2, xl: 3 }} gap="lg">
          {filteredAndSortedBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onSelect={() => onBookingSelect(booking)}
              compact
            />
          ))}
        </Grid>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onSelect={() => onBookingSelect(booking)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedBookings.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500">
            {filterStatus.length > 0 
              ? 'Try adjusting your status filters'
              : 'Your bookings will appear here once you make a reservation'
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Booking Card Component
const BookingCard: React.FC<{ 
  booking: BookingData; 
  onSelect: () => void; 
  compact?: boolean;
}> = ({ booking, onSelect, compact = false }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const },
    confirmed: { label: 'Confirmed', variant: 'success' as const },
    payment_pending: { label: 'Payment Pending', variant: 'warning' as const },
    active: { label: 'Active', variant: 'info' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'error' as const },
    disputed: { label: 'Disputed', variant: 'error' as const }
  };

  const getLatestEvent = () => {
    return booking.timeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <img
            src={getPrimaryPhoto(booking.vehicle.photos)}
            alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
            className="w-full h-32 object-cover rounded-t-lg"
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {booking.vehicle.make} {booking.vehicle.model}
            </h3>
            <Badge variant={statusConfig[booking.status].variant} size="sm">
              {statusConfig[booking.status].label}
            </Badge>
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDateRange(booking.date_range)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{booking.locations.pickup.city}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <span className="font-bold text-gray-900">
              {booking.pricing.currency} {booking.pricing.total_amount.toFixed(0)}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="flex">
        <div className="w-32 h-24 flex-shrink-0">
          <img
            src={getPrimaryPhoto(booking.vehicle.photos)}
            alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
              </h3>
              <p className="text-sm text-gray-500">Booking #{booking.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={statusConfig[booking.status].variant}>
                {statusConfig[booking.status].label}
              </Badge>
              <span className="text-lg font-bold text-gray-900">
                {booking.pricing.currency} {booking.pricing.total_amount.toFixed(0)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDateRange(booking.date_range)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{booking.locations.pickup.city} → {booking.locations.dropoff.city}</span>
            </div>
            <div className="flex items-center">
              <Car className="h-4 w-4 mr-2" />
              <span>by {booking.operator.name}</span>
            </div>
          </div>
          
          {getLatestEvent() && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {getLatestEvent().description} - {format(parseISO(getLatestEvent().timestamp), 'MMM dd, HH:mm')}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Skeleton Loading Component
const BookingCardSkeleton: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'grid') {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="w-full h-32 bg-gray-200 rounded-t-lg mb-4"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-4"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex animate-pulse">
        <div className="w-32 h-24 bg-gray-200 rounded-l-lg"></div>
        <div className="flex-1 p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};