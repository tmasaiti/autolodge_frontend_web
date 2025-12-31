import React, { useState, useEffect } from 'react';
import { AvailabilityConfig } from '../../types/vehicle';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AvailabilityCalendarProps {
  vehicleId: number;
  availability: AvailabilityConfig;
  onDateSelect?: (startDate: string, endDate: string) => void;
}

interface CalendarDay {
  date: string;
  isAvailable: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isPast: boolean;
  price?: number;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  vehicleId,
  availability,
  onDateSelect
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, vehicleId, availability]);

  const generateCalendarDays = async () => {
    setLoading(true);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const isPast = date < today;
      const isCurrentMonth = date.getMonth() === month;
      const isBlocked = availability.blocked_dates.includes(dateString);
      
      // Check if date is within advance booking window
      const advanceBookingLimit = new Date(today);
      advanceBookingLimit.setDate(today.getDate() + availability.advance_booking_days);
      const isWithinBookingWindow = date <= advanceBookingLimit;
      
      const isAvailable = isCurrentMonth && 
                         !isPast && 
                         !isBlocked && 
                         isWithinBookingWindow &&
                         availability.calendar_type !== 'request_based';

      days.push({
        date: dateString,
        isAvailable,
        isBlocked,
        isSelected: dateString === selectedStartDate || dateString === selectedEndDate,
        isInRange: isDateInRange(dateString),
        isPast,
        price: isAvailable ? Math.floor(Math.random() * 50) + 100 : undefined // Mock pricing
      });
    }

    setCalendarDays(days);
    setLoading(false);
  };

  const isDateInRange = (dateString: string): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const date = new Date(dateString);
    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    return date > start && date < end;
  };

  const handleDateClick = (dateString: string, day: CalendarDay) => {
    if (!day.isAvailable) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(dateString);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      // Complete selection
      const start = new Date(selectedStartDate);
      const end = new Date(dateString);
      
      if (end < start) {
        // If end date is before start date, swap them
        setSelectedStartDate(dateString);
        setSelectedEndDate(selectedStartDate);
        onDateSelect?.(dateString, selectedStartDate);
      } else {
        // Check minimum rental days
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < availability.minimum_rental_days) {
          // Extend to minimum rental days
          const minEndDate = new Date(start);
          minEndDate.setDate(start.getDate() + availability.minimum_rental_days);
          const minEndDateString = minEndDate.toISOString().split('T')[0];
          setSelectedEndDate(minEndDateString);
          onDateSelect?.(selectedStartDate, minEndDateString);
        } else {
          setSelectedEndDate(dateString);
          onDateSelect?.(selectedStartDate, dateString);
        }
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const clearSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Availability
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-4">
          {/* Availability Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Min {availability.minimum_rental_days} days, 
                Max {availability.maximum_rental_days} days
              </span>
            </div>
            
            {availability.calendar_type === 'request_based' && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800">Booking requires operator approval</span>
              </div>
            )}
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h3 className="font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const date = new Date(day.date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date, day)}
                  disabled={!day.isAvailable}
                  className={`
                    relative h-10 text-sm rounded transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${day.isBlocked ? 'text-red-300 cursor-not-allowed' : ''}
                    ${day.isAvailable ? 'hover:bg-blue-50 cursor-pointer' : ''}
                    ${day.isSelected ? 'bg-blue-600 text-white' : ''}
                    ${day.isInRange ? 'bg-blue-100 text-blue-900' : ''}
                  `}
                >
                  <span className="relative z-10">{date.getDate()}</span>
                  
                  {/* Availability indicator */}
                  {day.isAvailable && !day.isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                  
                  {day.isBlocked && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection Summary */}
          {selectedStartDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {selectedEndDate ? 'Selected Dates' : 'Start Date Selected'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {new Date(selectedStartDate).toLocaleDateString()}
                    {selectedEndDate && ` - ${new Date(selectedEndDate).toLocaleDateString()}`}
                  </p>
                  {selectedEndDate && (
                    <p className="text-xs text-blue-600 mt-1">
                      {Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-600"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Blocked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Selected</span>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};