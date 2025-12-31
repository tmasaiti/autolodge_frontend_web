import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { AvailabilityValidator } from './AvailabilityValidator';
import { PricingBreakdown } from './PricingBreakdown';
import { ContractDisplay } from './ContractDisplay';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Vehicle } from '../../types/vehicle';
import { BookingLocations, CrossBorderDetails, BookingAddOns, RentalAgreement } from '../../schemas/booking-schemas';
import { AvailabilityResult, PricingCalculationResult } from '../../services/bookingService';

export interface BookingFlowProps {
  vehicle: Vehicle;
  initialDates?: {
    startDate: string;
    endDate: string;
  };
  locations: BookingLocations;
  crossBorder?: CrossBorderDetails;
  addOns?: BookingAddOns;
  userCountry?: string;
  onBookingComplete: (bookingData: any) => void;
  onCancel?: () => void;
  className?: string;
}

enum BookingFlowStep {
  AVAILABILITY = 'availability',
  PRICING = 'pricing',
  CONTRACT = 'contract',
  PAYMENT = 'payment'
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  vehicle,
  initialDates,
  locations,
  crossBorder,
  addOns,
  userCountry,
  onBookingComplete,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<BookingFlowStep>(BookingFlowStep.AVAILABILITY);
  const [startDate, setStartDate] = useState(initialDates?.startDate || '');
  const [endDate, setEndDate] = useState(initialDates?.endDate || '');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:00');
  
  // Flow state
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingCalculationResult | null>(null);
  const [rentalAgreement, setRentalAgreement] = useState<RentalAgreement | null>(null);
  const [processing, setProcessing] = useState(false);

  // Step validation
  const canProceedFromAvailability = isAvailable && availabilityResult?.available;
  const canProceedFromPricing = pricingResult !== null;
  const canProceedFromContract = rentalAgreement !== null;

  const steps = [
    {
      id: BookingFlowStep.AVAILABILITY,
      title: 'Check Availability',
      description: 'Verify vehicle availability for your dates',
      icon: Calendar,
      completed: canProceedFromAvailability,
      canAccess: true
    },
    {
      id: BookingFlowStep.PRICING,
      title: 'Review Pricing',
      description: 'See detailed pricing breakdown',
      icon: CreditCard,
      completed: canProceedFromPricing,
      canAccess: canProceedFromAvailability
    },
    {
      id: BookingFlowStep.CONTRACT,
      title: 'Rental Agreement',
      description: 'Review and sign rental contract',
      icon: FileText,
      completed: canProceedFromContract,
      canAccess: canProceedFromPricing
    },
    {
      id: BookingFlowStep.PAYMENT,
      title: 'Complete Booking',
      description: 'Finalize your reservation',
      icon: CheckCircle,
      completed: false,
      canAccess: canProceedFromContract
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const currentStepData = steps[currentStepIndex];

  const handleAvailabilityChange = (available: boolean, result?: AvailabilityResult) => {
    setIsAvailable(available);
    setAvailabilityResult(result || null);
    
    // Reset subsequent steps if availability changes
    if (!available) {
      setPricingResult(null);
      setRentalAgreement(null);
      if (currentStep !== BookingFlowStep.AVAILABILITY) {
        setCurrentStep(BookingFlowStep.AVAILABILITY);
      }
    }
  };

  const handlePricingCalculated = (result: PricingCalculationResult) => {
    setPricingResult(result);
  };

  const handleAgreementAccepted = (agreement: RentalAgreement) => {
    setRentalAgreement(agreement);
  };

  const handleNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length && steps[nextStepIndex].canAccess) {
      setCurrentStep(steps[nextStepIndex].id);
    }
  };

  const handlePreviousStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id);
    }
  };

  const handleStepClick = (stepId: BookingFlowStep) => {
    const step = steps.find(s => s.id === stepId);
    if (step?.canAccess) {
      setCurrentStep(stepId);
    }
  };

  const handleCompleteBooking = async () => {
    if (!pricingResult || !rentalAgreement) return;

    setProcessing(true);
    
    try {
      // Prepare booking data
      const bookingData = {
        vehicle_id: vehicle.id,
        renter_id: 1, // This would come from auth context
        date_range: {
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime
        },
        locations,
        pricing: pricingResult.pricing,
        cross_border: crossBorder,
        add_ons: addOns,
        agreement: rentalAgreement,
        payment_method_id: 'mock_payment_method' // This would come from payment step
      };

      // Simulate booking creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onBookingComplete(bookingData);
    } catch (error) {
      console.error('Booking creation failed:', error);
      // Handle error - show error message
    } finally {
      setProcessing(false);
    }
  };

  // Prepare booking data for contract display
  const contractBookingData = pricingResult ? {
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      registration: vehicle.registration
    },
    dates: {
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime
    },
    locations: {
      pickup: { address: locations.pickup.address || '' },
      dropoff: { address: locations.dropoff.address || '' }
    },
    pricing: {
      daily_rate: pricingResult.pricing.daily_rate,
      total_days: pricingResult.pricing.total_days,
      security_deposit: pricingResult.pricing.security_deposit,
      total_amount: pricingResult.pricing.total_amount,
      currency: pricingResult.pricing.currency
    }
  } : null;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.completed;
            const canAccess = step.canAccess;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!canAccess}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-300' 
                      : canAccess
                        ? 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary-600 text-white'
                        : canAccess
                          ? 'bg-neutral-200 text-neutral-600'
                          : 'bg-neutral-100 text-neutral-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs opacity-75">{step.description}</p>
                  </div>
                </button>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-neutral-300 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-neutral-600">{currentStepData.description}</p>
        </div>

        {/* Date Selection (always visible for context) */}
        {currentStep === BookingFlowStep.AVAILABILITY && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-medium text-neutral-900 mb-4">Select Your Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Return Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step-specific content */}
        {currentStep === BookingFlowStep.AVAILABILITY && (
          <AvailabilityValidator
            vehicleId={vehicle.id}
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            onAvailabilityChange={handleAvailabilityChange}
          />
        )}

        {currentStep === BookingFlowStep.PRICING && (
          <PricingBreakdown
            vehicleId={vehicle.id}
            startDate={startDate}
            endDate={endDate}
            locations={locations}
            crossBorder={crossBorder}
            addOns={addOns}
            userCountry={userCountry}
            onPricingCalculated={handlePricingCalculated}
          />
        )}

        {currentStep === BookingFlowStep.CONTRACT && contractBookingData && (
          <ContractDisplay
            vehicleId={vehicle.id}
            bookingData={contractBookingData}
            onAgreementAccepted={handleAgreementAccepted}
          />
        )}

        {currentStep === BookingFlowStep.PAYMENT && pricingResult && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Ready to Complete Your Booking
            </h3>
            <p className="text-neutral-600 mb-6">
              Total Amount: {new Intl.NumberFormat('en-ZA', {
                style: 'currency',
                currency: pricingResult.pricing.currency
              }).format(pricingResult.pricing.total_amount)}
            </p>
            <Button
              variant="accent"
              size="lg"
              onClick={handleCompleteBooking}
              disabled={processing}
              className="px-8 py-3"
            >
              {processing ? 'Processing...' : 'Complete Booking'}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-neutral-200">
          <div>
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            
            {currentStep !== BookingFlowStep.PAYMENT && (
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={!steps[currentStepIndex].completed}
                className="flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};