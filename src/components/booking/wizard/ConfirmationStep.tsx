import React, { useState } from 'react';
import { Check, Calendar, MapPin, Shield, CreditCard, Download, Mail } from 'lucide-react';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface ConfirmationStepProps extends WizardStepProps {
  booking: any; // Complete booking data
  onConfirm: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  booking,
  allData,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToFinalTerms, setAgreedToFinalTerms] = useState(false);

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    
    // Simulate booking processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    onConfirm();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract data from wizard steps
  const datesLocationData = allData.dates_location || {};
  const crossBorderData = allData.cross_border || {};
  const insuranceData = allData.insurance || {};
  const paymentData = allData.payment || {};

  const totalAmount = 1250; // This would be calculated from all the data
  const currency = 'USD';

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
          Review Your Booking
        </h2>
        <p className="text-neutral-600">
          Please review all details before confirming your reservation.
        </p>
      </header>

      {/* Booking Summary Cards */}
      <section aria-labelledby="booking-summary-heading">
        <h2 id="booking-summary-heading" className="sr-only">Booking Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Vehicle & Dates */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" aria-hidden="true" />
              Rental Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600">Vehicle</p>
                <p className="font-medium">2023 Toyota Camry</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Pickup</p>
                  <p className="font-medium">
                    {datesLocationData.startDate ? formatDate(datesLocationData.startDate) : 'Not selected'}
                  </p>
                  <p className="text-sm text-neutral-500">{datesLocationData.startTime || '10:00'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Return</p>
                  <p className="font-medium">
                    {datesLocationData.endDate ? formatDate(datesLocationData.endDate) : 'Not selected'}
                  </p>
                  <p className="text-sm text-neutral-500">{datesLocationData.endTime || '10:00'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-600">Duration</p>
                <p className="font-medium">{datesLocationData.totalDays || 0} days</p>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" aria-hidden="true" />
              Locations
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600">Pickup Location</p>
                <p className="font-medium">
                  {datesLocationData.locations?.pickup?.address || 'Not specified'}
                </p>
                <p className="text-sm text-neutral-500">
                  {datesLocationData.locations?.pickup?.city}, {datesLocationData.locations?.pickup?.country}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-600">Return Location</p>
                <p className="font-medium">
                  {datesLocationData.locations?.same_location 
                    ? 'Same as pickup location'
                    : datesLocationData.locations?.dropoff?.address || 'Not specified'
                  }
                </p>
                {!datesLocationData.locations?.same_location && (
                  <p className="text-sm text-neutral-500">
                    {datesLocationData.locations?.dropoff?.city}, {datesLocationData.locations?.dropoff?.country}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cross-Border */}
          {crossBorderData.crossBorderRequired && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" aria-hidden="true" />
                Cross-Border Travel
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600">Destination Countries</p>
                  <p className="font-medium">
                    {crossBorderData.crossBorderDetails?.destination_countries?.join(', ') || 'None selected'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600">Additional Surcharge</p>
                  <p className="font-medium">
                    {formatCurrency(crossBorderData.crossBorderDetails?.surcharge_applied || 0, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insurance */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" aria-hidden="true" />
              Insurance Coverage
            </h3>
            
            <div className="space-y-4">
              {insuranceData.selectedInsurance ? (
                <>
                  <div>
                    <p className="text-sm text-neutral-600">Coverage Plan</p>
                    <p className="font-medium">{insuranceData.selectedInsurance.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-600">Premium</p>
                    <p className="font-medium">
                      {formatCurrency(insuranceData.selectedInsurance.premium_amount, currency)}/day
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-neutral-600">Coverage</p>
                  <p className="font-medium text-yellow-600">No additional insurance selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 md:col-span-2">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" aria-hidden="true" />
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600">Payment Method</p>
                  <p className="font-medium">
                    {paymentData.selectedPaymentMethod === 'credit_card' ? 'Credit Card' :
                     paymentData.selectedPaymentMethod === 'debit_card' ? 'Debit Card' :
                     paymentData.selectedPaymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                     'Not selected'}
                  </p>
                </div>
                
                {paymentData.paymentDetails?.cardNumber && (
                  <div>
                    <p className="text-sm text-neutral-600">Card</p>
                    <p className="font-medium">
                      **** **** **** {paymentData.paymentDetails.cardNumber.slice(-4)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Rental Amount:</span>
                  <span>{formatCurrency(1000, currency)}</span>
                </div>
                
                {crossBorderData.crossBorderRequired && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Cross-border Surcharge:</span>
                    <span>{formatCurrency(crossBorderData.crossBorderDetails?.surcharge_applied || 0, currency)}</span>
                  </div>
                )}
                
                {insuranceData.selectedInsurance && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Insurance Premium:</span>
                    <span>{formatCurrency(insuranceData.selectedInsurance.premium_amount * (datesLocationData.totalDays || 1), currency)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Security Deposit:</span>
                  <span>{formatCurrency(200, currency)}</span>
                </div>
                
                <div className="border-t border-neutral-200 pt-3 flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <aside className="bg-yellow-50 rounded-xl p-6">
        <h3 className="font-medium text-yellow-800 mb-3">Important Information</h3>
        <ul className="text-sm text-yellow-700 space-y-2">
          <li>• Your payment will be held in escrow until rental completion</li>
          <li>• You'll receive pickup instructions 24 hours before your rental</li>
          <li>• Please bring a valid driver's license and credit card for security deposit</li>
          <li>• Cancellation is free up to 24 hours before pickup</li>
          {crossBorderData.crossBorderRequired && (
            <li>• Cross-border permits will be processed within 2-3 business days</li>
          )}
        </ul>
      </aside>

      {/* Final Agreement */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="finalTerms"
            checked={agreedToFinalTerms}
            onChange={(e) => setAgreedToFinalTerms(e.target.checked)}
            className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            aria-describedby="final-terms-description"
          />
          <label htmlFor="finalTerms" className="text-sm text-neutral-700">
            <span id="final-terms-description">
              I have reviewed all booking details and agree to the rental terms and conditions. 
              I understand that this booking is subject to vehicle availability and operator approval.
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-8 border-t border-neutral-200">
        <div className="flex space-x-4">
          <Button variant="outline" className="flex items-center px-6 py-3">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Download Summary
          </Button>
          <Button variant="outline" className="flex items-center px-6 py-3">
            <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
            Email Summary
          </Button>
        </div>

        <Button 
          variant="accent" 
          onClick={handleConfirmBooking}
          disabled={!agreedToFinalTerms}
          loading={isProcessing}
          className="px-10 py-3 text-lg font-semibold"
        >
          {isProcessing ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};