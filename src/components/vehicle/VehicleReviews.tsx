import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Filter,
  ChevronDown,
  User
} from 'lucide-react';

interface Review {
  id: number;
  renter_name: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified_booking: boolean;
  helpful_count: number;
  photos?: string[];
  response?: {
    from_operator: boolean;
    message: string;
    date: string;
  };
}

interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface VehicleReviewsProps {
  vehicleId: number;
}

export const VehicleReviews: React.FC<VehicleReviewsProps> = ({ vehicleId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [vehicleId]);

  const loadReviews = async () => {
    setLoading(true);
    
    // Mock data - in real implementation, fetch from API
    const mockSummary: ReviewSummary = {
      average_rating: 4.6,
      total_reviews: 23,
      rating_breakdown: {
        5: 15,
        4: 5,
        3: 2,
        2: 1,
        1: 0
      }
    };

    const mockReviews: Review[] = [
      {
        id: 1,
        renter_name: 'Sarah M.',
        rating: 5,
        title: 'Excellent vehicle and service',
        comment: 'The car was in perfect condition, very clean and well-maintained. The operator was responsive and helpful throughout the rental period. Highly recommended!',
        date: '2024-01-15',
        verified_booking: true,
        helpful_count: 8,
        photos: ['/review-photo-1.jpg'],
        response: {
          from_operator: true,
          message: 'Thank you Sarah! We appreciate your feedback and look forward to serving you again.',
          date: '2024-01-16'
        }
      },
      {
        id: 2,
        renter_name: 'Michael K.',
        rating: 4,
        title: 'Good experience overall',
        comment: 'Vehicle was as described and pickup was smooth. Only minor issue was that the GPS was not updated, but everything else was great.',
        date: '2024-01-10',
        verified_booking: true,
        helpful_count: 3
      },
      {
        id: 3,
        renter_name: 'Lisa P.',
        rating: 5,
        title: 'Perfect for our family trip',
        comment: 'Spacious, comfortable, and fuel-efficient. The operator provided excellent customer service and even gave us local recommendations.',
        date: '2024-01-05',
        verified_booking: true,
        helpful_count: 12
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setSummary(mockSummary);
      setReviews(mockReviews);
      setLoading(false);
    }, 500);
  };

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.rating === parseInt(filter));

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number): number => {
    if (!summary) return 0;
    return (summary.rating_breakdown[rating as keyof typeof summary.rating_breakdown] / summary.total_reviews) * 100;
  };

  if (loading) {
    return (
      <Card>
        <Card.Content>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (!summary || reviews.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Reviews
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review this vehicle!
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Reviews ({summary.total_reviews})
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {summary.average_rating.toFixed(1)}
              </div>
              {renderStars(Math.round(summary.average_rating), 'md')}
              <p className="text-sm text-gray-600 mt-2">
                Based on {summary.total_reviews} reviews
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {summary.rating_breakdown[rating as keyof typeof summary.rating_breakdown]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All reviews</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {review.renter_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{review.renter_name}</span>
                        {review.verified_booking && (
                          <Badge variant="success" size="sm">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({review.helpful_count})</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    <MessageSquare className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Operator Response */}
                {review.response && (
                  <div className="mt-4 ml-6 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Response from operator
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.response.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.response.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {filteredReviews.length > 3 && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2"
              >
                {showAll ? 'Show Less' : `Show All ${filteredReviews.length} Reviews`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};