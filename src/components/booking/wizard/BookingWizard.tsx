import React, { useState, useMemo } from 'react';
import { WizardContainer, WizardStep } from '../../wizard';
import { DatesLocationStep } from './DatesLocationStep';
import { CrossBorderStep } from './CrossBorderStep';
import { InsuranceStep } from './InsuranceStep';
import { PaymentStep } from './PaymentStep';
import { ConfirmationStep } from './ConfirmationStep';
import { Vehicle } from '../../../types/vehicle';
// BookingData interface - matches bookings table structure
interface BookingData {
  id?: number;
  renter_id?: number;
  vehicle_id: number;
  operator_id: number;
  status: string;
  date_range: {
    start_date: string;
    end_date: string;
    actual_start_date?: string;
    actual_end_date?: string;
  };
  locations: any;
  pricing: any;
  cross_border?: any;
  add_ons?: any;
}

export interface BookingWizardProps {
  vehicle: Vehicle;
  initialDates?: {
    startDate: string;
    endDate: string;
  };
  onComplete: (booking: BookingData) => void;
  onCancel?: () => void;
  className?: string;
}

export enum BookingWizardStepId {
  DATES_LOCATION = 'dates_location',
  CROSS_BORDER = 'cross_border',
  INSURANCE = 'insurance',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  vehicle,
  initialDates,
  onComplete,
  onCancel,
  className
}) => {
  const [wizardData, setWizardData] = useState<any>({});

  // Calculate total amount based on wizard data
  const calculateTotalAmount = (): number => {
    const datesData = wizardData.dates_location;
    const crossBorderData = wizardData.cross_border;
    const insuranceData = wizardData.insurance;

    let total = 0;

    // Base rental amount
    if (datesData?.totalDays && vehicle.pricing?.base_daily_rate) {
      total += datesData.totalDays * vehicle.pricing.base_daily_rate;
    }

    // Cross-border surcharge
    if (crossBorderData?.crossBorderRequired && crossBorderData?.crossBorderDetails?.surcharge_applied) {
      total += crossBorderData.crossBorderDetails.surcharge_applied;
    }

    // Insurance premium
    if (insuranceData?.selectedInsurance && datesData?.totalDays) {
      total += insuranceData.selectedInsurance.premium_amount * datesData.totalDays;
    }

    // Security deposit
    total += vehicle.pricing?.security_deposit || 200;

    return total;
  };

  // Validation functions for each step
  const validateDatesLocationStep = (): boolean => {
    const data = wizardData.dates_location;
    return !!(
      data?.startDate &&
      data?.endDate &&
      data?.locations?.pickup?.address &&
      (data?.locations?.same_location || data?.locations?.dropoff?.address)
    );
  };

  const validateCrossBorderStep = (): boolean => {
    const data = wizardData.cross_border;
    if (!data?.crossBorderRequired) return true;
    
    return !!(
      data?.crossBorderDetails?.destination_countries?.length > 0 &&
      data?.acknowledgedRequirements
    );
  };

  const validateInsuranceStep = (): boolean => {
    const data = wizardData.insurance;
    return !!(
      data?.selectedInsuranceId ||
      (data?.skipInsurance && data?.acknowledgedRisks)
    );
  };

  const validatePaymentStep = (): boolean => {
    const data = wizardData.payment;
    return !!(
      data?.selectedPaymentMethod &&
      data?.agreedToTerms &&
      data?.agreedToEscrow &&
      data?.paymentDetails?.billingAddress?.street
    );
  };

  // Define wizard steps
  const steps: WizardStep[] = useMemo(() => [
    {
      id: BookingWizardStepId.DATES_LOCATION,
      title: 'Dates & Location',
      description: 'When and where do you need the vehicle?',
      component: (
        <DatesLocationStep
          vehicle={vehicle}
          initialDates={initialDates}
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: validateDatesLocationStep
    },
    {
      id: BookingWizardStepId.CROSS_BORDER,
      title: 'Cross-Border Travel',
      description: 'Will you travel to other SADC countries?',
      component: (
        <CrossBorderStep
          vehicle={vehicle}
          baseDailyRate={vehicle.pricing?.base_daily_rate || 0}
          totalDays={wizardData.dates_location?.totalDays || 1}
          baseCurrency={vehicle.pricing?.currency || 'USD'}
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      condition: vehicle.cross_border_config?.allowed || false,
      validation: validateCrossBorderStep
    },
    {
      id: BookingWizardStepId.INSURANCE,
      title: 'Insurance Coverage',
      description: 'Protect your journey with insurance',
      component: (
        <InsuranceStep
          booking={wizardData}
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: validateInsuranceStep
    },
    {
      id: BookingWizardStepId.PAYMENT,
      title: 'Payment Details',
      description: 'Secure payment and billing information',
      component: (
        <PaymentStep
          booking={wizardData}
          totalAmount={calculateTotalAmount()}
          currency={vehicle.pricing?.currency || 'USD'}
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: validatePaymentStep
    },
    {
      id: BookingWizardStepId.CONFIRMATION,
      title: 'Confirmation',
      description: 'Review and confirm your booking',
      component: (
        <ConfirmationStep
          booking={wizardData}
          data={{}}
          allData={{}}
          onDataChange={() => {}}
          onConfirm={handleBookingComplete}
        />
      )
    }
  ], [vehicle, initialDates, wizardData]);

  const handleBookingComplete = () => {
    // Transform wizard data into BookingData format
    const bookingData: Partial<BookingData> = {
      vehicle_id: vehicle.id,
      operator_id: vehicle.operator_id,
      status: 'pending_confirmation' as any,
      date_range: {
        start_date: wizardData.dates_location?.startDate,
        end_date: wizardData.dates_location?.endDate
      },
      locations: wizardData.dates_location?.locations,
      pricing: {
        daily_rate: vehicle.pricing?.base_daily_rate || 0,
        total_days: wizardData.dates_location?.totalDays || 0,
        subtotal: calculateTotalAmount() - (vehicle.pricing?.security_deposit || 200),
        taxes: [], // Would be calculated by backend
        platform_fee: 0, // Would be calculated by backend
        security_deposit: vehicle.pricing?.security_deposit || 200,
        cross_border_surcharge: wizardData.cross_border?.crossBorderDetails?.surcharge_applied,
        insurance_premium: wizardData.insurance?.selectedInsurance ? 
          wizardData.insurance.selectedInsurance.premium_amount * (wizardData.dates_location?.totalDays || 1) : 
          undefined,
        additional_fees: {
          cleaning_fee: 0,
          delivery_fee: 0,
          fuel_fee: 0,
          late_return_fee: 0
        },
        discounts: {
          weekly_discount: 0,
          monthly_discount: 0,
          promotional_discount: 0,
          loyalty_discount: 0
        },
        total_amount: calculateTotalAmount(),
        currency: vehicle.pricing?.currency || 'USD'
      },
      cross_border: wizardData.cross_border?.crossBorderRequired ? 
        wizardData.cross_border.crossBorderDetails : 
        undefined,
      add_ons: {
        insurance_product_id: wizardData.insurance?.selectedInsuranceId
      }
    };

    onComplete(bookingData as BookingData);
  };

  const handleWizardDataChange = (stepId: string, data: any) => {
    setWizardData((prev: any) => ({
      ...prev,
      [stepId]: data
    }));
  };

  return (
    <WizardContainer
      steps={steps}
      onComplete={handleBookingComplete}
      onCancel={onCancel}
      className={className}
      persistKey={`booking_${vehicle.id}`}
      showProgress={true}
      allowSkipSteps={false}
    />
  );
};