/**
 * Escrow Explanation Component
 * Explains escrow system to users for transparency
 * Implements requirement 6.2 (escrow explanation and status display)
 */

import React, { useState } from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface EscrowExplanationProps {
  className?: string;
  detailed?: boolean;
}

export const EscrowExplanation: React.FC<EscrowExplanationProps> = ({
  className = '',
  detailed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(detailed);

  const escrowSteps = [
    {
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      title: 'Payment Secured',
      description: 'Your payment is held safely in our escrow account',
      detail: 'When you make a payment, funds are immediately transferred to a secure escrow account managed by AutoLodge. This ensures your money is protected until the rental is completed successfully.'
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      title: 'Rental Period',
      description: 'Funds remain protected during your rental',
      detail: 'Throughout your rental period, the funds remain in escrow. The vehicle operator cannot access the money until you confirm successful completion of the rental or the automatic release period expires.'
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: 'Automatic Release',
      description: 'Funds are released after successful rental completion',
      detail: 'After you return the vehicle and confirm completion, funds are automatically released to the operator within 24-48 hours. If no disputes are raised, this happens automatically for your convenience.'
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      title: 'Dispute Protection',
      description: 'Funds are frozen if disputes arise',
      detail: 'If any issues occur during the rental, you can raise a dispute. The funds will remain frozen in escrow until the dispute is resolved fairly by our team, ensuring protection for both parties.'
    }
  ];

  return (
    <Card className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Secure Escrow Payment Protection
          </h3>
          
          <p className="text-blue-800 mb-4">
            Your payment is protected by our secure escrow system. Funds are held safely until 
            your rental is completed successfully, providing peace of mind for both renters and operators.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic Release</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Dispute Protection</span>
            </div>
          </div>

          {/* Expandable Details */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-700 hover:text-blue-800 p-0 h-auto font-medium"
            >
              {isExpanded ? 'Hide Details' : 'How It Works'}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-4 space-y-4">
                {escrowSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-blue-100">
                    <div className="flex-shrink-0 mt-0.5">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900 mb-1">
                        {index + 1}. {step.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mb-2">
                        {step.description}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Additional Information */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
                  <h4 className="font-medium text-neutral-900 mb-2">Important Information</h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>• Escrow accounts are managed by licensed financial institutions</li>
                    <li>• Funds are insured and protected by banking regulations</li>
                    <li>• Automatic release occurs 48 hours after successful rental completion</li>
                    <li>• Dispute resolution typically takes 3-7 business days</li>
                    <li>• No additional fees for escrow protection</li>
                  </ul>
                </div>

                {/* Contact Information */}
                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-blue-800">
                    If you have questions about our escrow system or need assistance with a payment, 
                    contact our support team at{' '}
                    <a href="mailto:support@autolodge.com" className="underline hover:no-underline">
                      support@autolodge.com
                    </a>
                    {' '}or call +27 11 123 4567.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};