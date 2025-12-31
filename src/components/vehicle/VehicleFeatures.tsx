import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Wifi, 
  Navigation, 
  Snowflake, 
  Sun, 
  Music, 
  Bluetooth, 
  Usb, 
  Car,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';

interface VehicleFeaturesProps {
  features: string[];
}

// Map feature names to icons and categories
const featureConfig: Record<string, { icon: React.ComponentType<any>; category: string; color: string }> = {
  'GPS': { icon: Navigation, category: 'Navigation', color: 'blue' },
  'Air Conditioning': { icon: Snowflake, category: 'Comfort', color: 'cyan' },
  'Heating': { icon: Sun, category: 'Comfort', color: 'orange' },
  'Bluetooth': { icon: Bluetooth, category: 'Connectivity', color: 'indigo' },
  'USB Charging': { icon: Usb, category: 'Connectivity', color: 'green' },
  'WiFi Hotspot': { icon: Wifi, category: 'Connectivity', color: 'purple' },
  'Premium Audio': { icon: Music, category: 'Entertainment', color: 'pink' },
  'Backup Camera': { icon: Car, category: 'Safety', color: 'red' },
  'Parking Sensors': { icon: Shield, category: 'Safety', color: 'red' },
  'Keyless Entry': { icon: Zap, category: 'Convenience', color: 'yellow' },
  'Push Start': { icon: Zap, category: 'Convenience', color: 'yellow' },
};

export const VehicleFeatures: React.FC<VehicleFeaturesProps> = ({ features }) => {
  // Group features by category
  const groupedFeatures = features.reduce((acc, feature) => {
    const config = featureConfig[feature];
    const category = config?.category || 'Other';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, string[]>);

  const categories = Object.keys(groupedFeatures);

  if (features.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Features & Amenities</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-500">No additional features listed for this vehicle.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Features & Amenities
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedFeatures[category].map((feature, index) => {
                  const config = featureConfig[feature];
                  const IconComponent = config?.icon || CheckCircle;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 bg-${config?.color || 'gray'}-100 rounded-lg flex items-center justify-center`}>
                        <IconComponent className={`w-4 h-4 text-${config?.color || 'gray'}-600`} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{feature}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {features.slice(0, 5).map((feature, index) => (
              <Badge key={index} variant="primary" size="sm">
                {feature}
              </Badge>
            ))}
            {features.length > 5 && (
              <Badge variant="secondary" size="sm">
                +{features.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};