import React, { useState, useEffect } from 'react';
import { FileText, Download, Check, AlertCircle, Eye, Printer } from 'lucide-react';
import { bookingService, ContractTemplate } from '../../services/bookingService';
import { RentalAgreement } from '../../schemas/booking-schemas';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export interface ContractDisplayProps {
  vehicleId: number;
  bookingData: {
    vehicle: {
      make: string;
      model: string;
      registration: string;
    };
    dates: {
      start_date: string;
      end_date: string;
      start_time?: string;
      end_time?: string;
    };
    locations: {
      pickup: { address: string };
      dropoff: { address: string };
    };
    pricing: {
      daily_rate: number;
      total_days: number;
      security_deposit: number;
      total_amount: number;
      currency: string;
    };
  };
  onAgreementAccepted: (agreement: RentalAgreement) => void;
  className?: string;
}

export const ContractDisplay: React.FC<ContractDisplayProps> = ({
  vehicleId,
  bookingData,
  onAgreementAccepted,
  className = ''
}) => {
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [agreement, setAgreement] = useState<Partial<RentalAgreement>>({
    terms_accepted: false,
    insurance_acknowledgment: false,
    damage_policy_accepted: false,
    fuel_policy: 'full_to_full',
    liability_waivers: []
  });
  const [acceptedTerms, setAcceptedTerms] = useState<Set<number>>(new Set());
  const [acceptedWaivers, setAcceptedWaivers] = useState<Set<number>>(new Set());
  const [digitalSignature, setDigitalSignature] = useState('');

  // Load contract template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const contractTemplate = await bookingService.getContractTemplate(vehicleId);
        setTemplate(contractTemplate);
        
        // Initialize agreement with template data
        setAgreement(prev => ({
          ...prev,
          template_id: contractTemplate.id,
          version: contractTemplate.version,
          mileage_policy: contractTemplate.mileage_policy
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contract template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [vehicleId]);

  // Generate contract HTML with booking data
  const generateContractHTML = () => {
    if (!template) return '';

    let html = template.template_html;
    
    // Replace placeholders with actual data
    const replacements = {
      '{{vehicle_make}}': bookingData.vehicle.make,
      '{{vehicle_model}}': bookingData.vehicle.model,
      '{{vehicle_registration}}': bookingData.vehicle.registration,
      '{{start_date}}': new Date(bookingData.dates.start_date).toLocaleDateString(),
      '{{end_date}}': new Date(bookingData.dates.end_date).toLocaleDateString(),
      '{{start_time}}': bookingData.dates.start_time || '10:00',
      '{{end_time}}': bookingData.dates.end_time || '10:00',
      '{{pickup_address}}': bookingData.locations.pickup.address,
      '{{return_address}}': bookingData.locations.dropoff.address,
      '{{daily_rate}}': bookingData.pricing.daily_rate.toString(),
      '{{total_days}}': bookingData.pricing.total_days.toString(),
      '{{security_deposit}}': bookingData.pricing.security_deposit.toString(),
      '{{total_amount}}': bookingData.pricing.total_amount.toString(),
      '{{currency}}': bookingData.pricing.currency,
      '{{fuel_policy}}': agreement.fuel_policy || 'full_to_full',
      '{{included_km}}': template.mileage_policy.included_km.toString(),
      '{{excess_rate}}': template.mileage_policy.excess_rate.toString()
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return html;
  };

  const handleTermAcceptance = (termIndex: number) => {
    const newAcceptedTerms = new Set(acceptedTerms);
    if (newAcceptedTerms.has(termIndex)) {
      newAcceptedTerms.delete(termIndex);
    } else {
      newAcceptedTerms.add(termIndex);
    }
    setAcceptedTerms(newAcceptedTerms);
  };

  const handleWaiverAcceptance = (waiverIndex: number) => {
    const newAcceptedWaivers = new Set(acceptedWaivers);
    if (newAcceptedWaivers.has(waiverIndex)) {
      newAcceptedWaivers.delete(waiverIndex);
    } else {
      newAcceptedWaivers.add(waiverIndex);
    }
    setAcceptedWaivers(newAcceptedWaivers);
  };

  const handleFuelPolicyChange = (policy: 'full_to_full' | 'same_to_same' | 'prepaid') => {
    setAgreement(prev => ({ ...prev, fuel_policy: policy }));
  };

  const isAgreementComplete = () => {
    if (!template) return false;
    
    const requiredTermsAccepted = template.terms
      .filter(term => term.required_acknowledgment)
      .every((_, index) => acceptedTerms.has(index));
    
    const allWaiversAccepted = acceptedWaivers.size === template.liability_waivers.length;
    
    return (
      agreement.terms_accepted &&
      agreement.insurance_acknowledgment &&
      agreement.damage_policy_accepted &&
      requiredTermsAccepted &&
      allWaiversAccepted &&
      digitalSignature.trim().length > 0
    );
  };

  const handleAcceptAgreement = () => {
    if (!isAgreementComplete() || !template) return;

    const finalAgreement: RentalAgreement = {
      template_id: template.id,
      version: template.version,
      terms_accepted: true,
      accepted_at: new Date().toISOString(),
      accepted_by: 1, // This would be the actual user ID
      digital_signature: digitalSignature,
      liability_waivers: template.liability_waivers,
      insurance_acknowledgment: agreement.insurance_acknowledgment!,
      damage_policy_accepted: agreement.damage_policy_accepted!,
      fuel_policy: agreement.fuel_policy!,
      mileage_policy: template.mileage_policy
    };

    onAgreementAccepted(finalAgreement);
  };

  const downloadContract = () => {
    const contractHTML = generateContractHTML();
    const blob = new Blob([contractHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental-agreement-${bookingData.vehicle.registration}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
          <div>
            <p className="text-blue-800 font-medium">Loading rental agreement...</p>
            <p className="text-blue-600 text-sm">Preparing your contract</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Failed to load contract</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Rental Agreement</h3>
              <p className="text-sm text-neutral-600">Version {template.version}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadContract}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Contract Terms */}
        <div>
          <h4 className="text-base font-semibold text-neutral-900 mb-4">Contract Terms</h4>
          <div className="space-y-3">
            {template.terms.map((term, index) => (
              <div key={index} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`term-${index}`}
                  checked={acceptedTerms.has(index)}
                  onChange={() => handleTermAcceptance(index)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  required={term.required_acknowledgment}
                />
                <label htmlFor={`term-${index}`} className="text-sm text-neutral-700 cursor-pointer">
                  <span className="font-medium">{term.section}:</span> {term.content}
                  {term.required_acknowledgment && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Liability Waivers */}
        <div>
          <h4 className="text-base font-semibold text-neutral-900 mb-4">Liability Waivers</h4>
          <div className="space-y-3">
            {template.liability_waivers.map((waiver, index) => (
              <div key={index} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`waiver-${index}`}
                  checked={acceptedWaivers.has(index)}
                  onChange={() => handleWaiverAcceptance(index)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  required
                />
                <label htmlFor={`waiver-${index}`} className="text-sm text-neutral-700 cursor-pointer">
                  {waiver} <span className="text-red-500">*</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Policy Selection */}
        <div>
          <h4 className="text-base font-semibold text-neutral-900 mb-4">Fuel Policy</h4>
          <div className="space-y-2">
            {template.fuel_policy_options.map((policy) => (
              <div key={policy} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`fuel-${policy}`}
                  name="fuel_policy"
                  value={policy}
                  checked={agreement.fuel_policy === policy}
                  onChange={() => handleFuelPolicyChange(policy)}
                  className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={`fuel-${policy}`} className="text-sm text-neutral-700 cursor-pointer capitalize">
                  {policy.replace('_', ' ')}
                  {policy === 'full_to_full' && (
                    <span className="text-neutral-500 ml-2">(Recommended)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Acknowledgments */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="insurance-ack"
              checked={agreement.insurance_acknowledgment}
              onChange={(e) => setAgreement(prev => ({ 
                ...prev, 
                insurance_acknowledgment: e.target.checked 
              }))}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              required
            />
            <label htmlFor="insurance-ack" className="text-sm text-neutral-700 cursor-pointer">
              I acknowledge and understand the insurance coverage and my responsibilities regarding claims and deductibles.
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="damage-policy"
              checked={agreement.damage_policy_accepted}
              onChange={(e) => setAgreement(prev => ({ 
                ...prev, 
                damage_policy_accepted: e.target.checked 
              }))}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              required
            />
            <label htmlFor="damage-policy" className="text-sm text-neutral-700 cursor-pointer">
              I accept responsibility for any damage to the vehicle during the rental period and agree to the damage assessment policy.
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms-accepted"
              checked={agreement.terms_accepted}
              onChange={(e) => setAgreement(prev => ({ 
                ...prev, 
                terms_accepted: e.target.checked 
              }))}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              required
            />
            <label htmlFor="terms-accepted" className="text-sm text-neutral-700 cursor-pointer">
              I have read, understood, and agree to all terms and conditions of this rental agreement.
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
        </div>

        {/* Digital Signature */}
        <div>
          <label htmlFor="digital-signature" className="block text-sm font-medium text-neutral-700 mb-2">
            Digital Signature <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="digital-signature"
            value={digitalSignature}
            onChange={(e) => setDigitalSignature(e.target.value)}
            placeholder="Type your full name as your digital signature"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
          <p className="text-xs text-neutral-500 mt-1">
            By typing your name, you are providing a legally binding digital signature
          </p>
        </div>

        {/* Accept Agreement Button */}
        <div className="pt-4 border-t border-neutral-200">
          <Button
            variant="accent"
            onClick={handleAcceptAgreement}
            disabled={!isAgreementComplete()}
            className="w-full py-3 text-lg font-semibold flex items-center justify-center space-x-2"
          >
            <Check className="h-5 w-5" />
            <span>Accept Rental Agreement</span>
          </Button>
          
          {!isAgreementComplete() && (
            <p className="text-sm text-neutral-500 text-center mt-2">
              Please complete all required fields and acknowledgments above
            </p>
          )}
        </div>
      </div>

      {/* Contract Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        size="xl"
      >
        <Modal.Header>
          <h3 className="text-lg font-semibold text-neutral-900">Rental Agreement Preview</h3>
        </Modal.Header>
        <Modal.Body>
          <div className="max-h-96 overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generateContractHTML() }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button onClick={downloadContract} className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Print/Save</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};