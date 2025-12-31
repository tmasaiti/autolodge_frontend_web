import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  User, 
  Star, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Shield,
  Award,
  Clock
} from 'lucide-react';

interface OperatorData {
  id: number;
  business_name: string;
  contact_name: string;
  location: {
    city: string;
    country: string;
  };
  verification_status: 'verified' | 'pending' | 'unverified';
  rating: number;
  review_count: number;
  response_time: string;
  response_rate: number;
  joined_date: string;
  total_bookings: number;
  fleet_size: number;
}

interface OperatorProfileProps {
  operatorId: number;
}

export const OperatorProfile: React.FC<OperatorProfileProps> = ({ operatorId }) => {
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, fetch from API
    const mockOperator: OperatorData = {
      id: operatorId,
      business_name: 'Premium Car Rentals',
      contact_name: 'John Mthembu',
      location: {
        city: 'Cape Town',
        country: 'South Africa'
      },
      verification_status: 'verified',
      rating: 4.8,
      review_count: 156,
      response_time: '< 1 hour',
      response_rate: 98,
      joined_date: '2022-03-15',
      total_bookings: 342,
      fleet_size: 12
    };

    // Simulate API call
    setTimeout(() => {
      setOperator(mockOperator);
      setLoading(false);
    }, 500);
  }, [operatorId]);

  const handleContactOperator = () => {
    // TODO: Implement contact functionality
    console.log('Contact operator:', operatorId);
  };

  if (loading) {
    return (
      <Card>
        <Card.Content>
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (!operator) {
    return (
      <Card>
        <Card.Content>
          <p className="text-gray-500">Operator information not available</p>
        </Card.Content>
      </Card>
    );
  }

  const joinedYear = new Date(operator.joined_date).getFullYear();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Vehicle Operator
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-6">
          {/* Operator Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {operator.business_name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {operator.business_name}
                </h3>
                {operator.verification_status === 'verified' && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 mb-2">
                Operated by {operator.contact_name}
              </p>
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{operator.location.city}, {operator.location.country}</span>
              </div>
            </div>
          </div>

          {/* Rating and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-semibold">{operator.rating}</span>
              </div>
              <p className="text-xs text-gray-500">{operator.review_count} reviews</p>
            </div>
            
            <div className="text-center">
              <div className="font-semibold mb-1">{operator.response_rate}%</div>
              <p className="text-xs text-gray-500">Response rate</p>
            </div>
            
            <div className="text-center">
              <div className="font-semibold mb-1">{operator.response_time}</div>
              <p className="text-xs text-gray-500">Response time</p>
            </div>
            
            <div className="text-center">
              <div className="font-semibold mb-1">{operator.fleet_size}</div>
              <p className="text-xs text-gray-500">Vehicles</p>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Experienced Operator</p>
                <p className="text-sm text-gray-600">
                  {operator.total_bookings} completed bookings since {joinedYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Since {joinedYear}</span>
            </div>
          </div>

          {/* Quick Response Badge */}
          {operator.response_time.includes('hour') && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Quick Response</p>
                <p className="text-sm text-green-700">
                  Usually responds within {operator.response_time}
                </p>
              </div>
            </div>
          )}

          {/* Contact Button */}
          <Button
            onClick={handleContactOperator}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Operator
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};