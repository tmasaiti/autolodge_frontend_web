/**
 * Example component demonstrating JSON handler usage
 * Shows how to use JSON validation in React components
 */

import React, { useState } from 'react';
import { useUserProfile, useVehicleSpecifications } from '../../hooks/useJSONHandler';

export const JSONHandlerExample: React.FC = () => {
  const [rawUserData, setRawUserData] = useState('');
  const [rawVehicleData, setRawVehicleData] = useState('');

  const userProfile = useUserProfile();
  const vehicleSpecs = useVehicleSpecifications();

  const handleUserDataSubmit = () => {
    try {
      const parsed = JSON.parse(rawUserData);
      userProfile.validate(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const handleVehicleDataSubmit = () => {
    try {
      const parsed = JSON.parse(rawVehicleData);
      vehicleSpecs.validate(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">JSON Handler Example</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">User Profile Handler</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Raw JSON Data:
            </label>
            <textarea
              className="w-full p-2 border rounded"
              rows={6}
              value={rawUserData}
              onChange={(e) => setRawUserData(e.target.value)}
              placeholder='{"first_name": "John", "last_name": "Doe", ...}'
            />
          </div>
          
          <button
            onClick={handleUserDataSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Validate User Data
          </button>
          
          <div className="mt-4">
            <div className={`p-2 rounded ${userProfile.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Status:</strong> {userProfile.isValid ? 'Valid' : 'Invalid'}
            </div>
            
            {userProfile.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <strong>Error:</strong> {userProfile.error.message}
              </div>
            )}
            
            <div className="mt-2">
              <strong>Current Data:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {userProfile.serialize()}
              </pre>
            </div>
          </div>
        </div>

        {/* Vehicle Specifications Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Vehicle Specifications Handler</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Raw JSON Data:
            </label>
            <textarea
              className="w-full p-2 border rounded"
              rows={6}
              value={rawVehicleData}
              onChange={(e) => setRawVehicleData(e.target.value)}
              placeholder='{"engine": {"type": "V6", "displacement": 3.0, ...}, ...}'
            />
          </div>
          
          <button
            onClick={handleVehicleDataSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Validate Vehicle Data
          </button>
          
          <div className="mt-4">
            <div className={`p-2 rounded ${vehicleSpecs.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Status:</strong> {vehicleSpecs.isValid ? 'Valid' : 'Invalid'}
            </div>
            
            {vehicleSpecs.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <strong>Error:</strong> {vehicleSpecs.error.message}
              </div>
            )}
            
            <div className="mt-2">
              <strong>Current Data:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {vehicleSpecs.serialize()}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Usage Instructions:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Enter valid JSON data in the text areas above</li>
          <li>Click the validate buttons to test the JSON handlers</li>
          <li>Valid data will be processed and stored</li>
          <li>Invalid data will show validation errors</li>
          <li>The handlers automatically provide default values for malformed data</li>
        </ul>
      </div>

      {/* Sample Data */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold mb-2">Sample Valid Data:</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-1">User Profile:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
{`{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "nationality": "ZA",
  "address": {
    "latitude": -26.2041,
    "longitude": 28.0473,
    "city": "Johannesburg",
    "country": "ZA"
  }
}`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Vehicle Specifications:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
{`{
  "engine": {
    "type": "V6",
    "displacement": 3.0,
    "fuel_type": "petrol"
  },
  "transmission": "automatic",
  "drivetrain": "awd",
  "seats": 5,
  "doors": 4,
  "dimensions": {
    "length_mm": 4500,
    "width_mm": 1800,
    "height_mm": 1600
  },
  "weight": {
    "curb_weight_kg": 1500,
    "gross_weight_kg": 2000,
    "payload_kg": 500
  },
  "features": ["GPS", "Bluetooth"],
  "safety_features": ["ABS", "Airbags"],
  "entertainment": ["Radio", "USB"],
  "comfort_features": ["AC", "Power Windows"]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};