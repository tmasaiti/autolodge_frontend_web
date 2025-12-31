import React from 'react';
import { VehicleSpecifications as VehicleSpecsType } from '../../types/vehicle';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Cog, Users, DoorOpen, Gauge, Fuel, Zap } from 'lucide-react';

interface VehicleSpecificationsProps {
  specs: VehicleSpecsType;
}

export const VehicleSpecifications: React.FC<VehicleSpecificationsProps> = ({ specs }) => {
  const specItems = [
    {
      icon: Zap,
      label: 'Engine',
      value: `${specs.engine.displacement}L ${specs.engine.type}`,
      description: specs.engine.fuel_type
    },
    {
      icon: Cog,
      label: 'Transmission',
      value: specs.transmission,
      description: 'Gearbox type'
    },
    {
      icon: Users,
      label: 'Seating',
      value: `${specs.seats} passengers`,
      description: 'Maximum capacity'
    },
    {
      icon: DoorOpen,
      label: 'Doors',
      value: `${specs.doors} doors`,
      description: 'Vehicle configuration'
    }
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Vehicle Specifications
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Features */}
        {specs.safety_features.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Safety Features</h4>
            <div className="flex flex-wrap gap-2">
              {specs.safety_features.map((feature, index) => (
                <Badge key={index} variant="success" size="sm">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Entertainment Features */}
        {specs.entertainment.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-3">Entertainment & Comfort</h4>
            <div className="flex flex-wrap gap-2">
              {specs.entertainment.map((feature, index) => (
                <Badge key={index} variant="info" size="sm">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};