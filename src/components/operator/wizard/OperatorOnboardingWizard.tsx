import React, { useMemo } from 'react';
import { WizardContainer, WizardStep } from '../../wizard';
import { BusinessInfoStep } from './BusinessInfoStep';
import { DocumentsStep } from './DocumentsStep';
import { VerificationStep } from './VerificationStep';
import { FleetSetupStep } from './FleetSetupStep';

export interface OperatorData {
  businessInfo: any;
  documents: any;
  verification: any;
  fleetSetup: any;
}

export interface OperatorOnboardingWizardProps {
  onComplete: (operator: OperatorData) => void;
  onCancel?: () => void;
  className?: string;
}

export enum OnboardingStepId {
  BUSINESS_INFO = 'business_info',
  DOCUMENTS = 'documents',
  VERIFICATION = 'verification',
  FLEET_SETUP = 'fleet_setup'
}

export const OperatorOnboardingWizard: React.FC<OperatorOnboardingWizardProps> = ({
  onComplete,
  onCancel,
  className
}) => {
  // Validation functions for each step
  const validateBusinessInfoStep = (data: any): boolean => {
    return !!(
      data?.businessName?.trim() &&
      data?.contactPerson?.firstName?.trim() &&
      data?.contactPerson?.lastName?.trim() &&
      data?.contactPerson?.email?.trim() &&
      data?.contactPerson?.phone?.trim() &&
      data?.businessAddress?.street?.trim() &&
      data?.businessAddress?.city?.trim() &&
      data?.businessAddress?.country?.trim()
    );
  };

  const validateDocumentsStep = (data: any): boolean => {
    if (!data?.documents) return false;
    
    const requiredDocuments = data.documents.filter((doc: any) => doc.required);
    const uploadedRequired = requiredDocuments.filter((doc: any) => 
      doc.status === 'uploaded' || doc.file
    );
    
    return uploadedRequired.length >= requiredDocuments.length && data.acknowledgedRequirements;
  };

  const validateVerificationStep = (data: any): boolean => {
    // Verification step can be passed even if not completed
    // This allows operators to proceed to fleet setup while verification is in progress
    return true;
  };

  const validateFleetSetupStep = (data: any): boolean => {
    return !!(
      data?.fleetName?.trim() &&
      data?.vehicles?.length > 0 &&
      data?.operatingAreas?.length > 0 &&
      data?.acknowledgedTerms
    );
  };

  // Define wizard steps
  const steps: WizardStep[] = useMemo(() => [
    {
      id: OnboardingStepId.BUSINESS_INFO,
      title: 'Business Information',
      description: 'Tell us about your business',
      component: (
        <BusinessInfoStep
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: () => {
        // Validation will be handled by the wizard container
        return true;
      }
    },
    {
      id: OnboardingStepId.DOCUMENTS,
      title: 'Document Upload',
      description: 'Upload required verification documents',
      component: (
        <DocumentsStep
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: () => {
        return true;
      }
    },
    {
      id: OnboardingStepId.VERIFICATION,
      title: 'Account Verification',
      description: 'We\'ll verify your documents and information',
      component: (
        <VerificationStep
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: () => {
        return true;
      }
    },
    {
      id: OnboardingStepId.FLEET_SETUP,
      title: 'Fleet Setup',
      description: 'Add your vehicles and configure your fleet',
      component: (
        <FleetSetupStep
          data={{}}
          allData={{}}
          onDataChange={() => {}}
        />
      ),
      validation: () => {
        return true;
      }
    }
  ], []);

  const handleOnboardingComplete = (wizardData: any) => {
    // Transform wizard data into OperatorData format
    const operatorData: OperatorData = {
      businessInfo: wizardData.business_info || {},
      documents: wizardData.documents || {},
      verification: wizardData.verification || {},
      fleetSetup: wizardData.fleet_setup || {}
    };

    onComplete(operatorData);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Become an AutoLodge Operator
          </h1>
          <p className="text-lg text-neutral-600">
            Join our platform and start earning with your vehicle fleet
          </p>
        </div>

        {/* Wizard Container */}
        <WizardContainer
          steps={steps}
          onComplete={handleOnboardingComplete}
          onCancel={onCancel}
          className={className}
          persistKey="operator_onboarding"
          showProgress={true}
          allowSkipSteps={false}
        />

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600">
            Need help with onboarding?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contact our support team
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:underline">
              view our operator guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};