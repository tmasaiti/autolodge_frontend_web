import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OperatorOnboardingWizard } from '../components/operator/wizard';

export const OperatorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (operatorData: any) => {
    console.log('Operator onboarding completed:', operatorData);
    // In a real app, this would save to backend
    alert('Congratulations! Your operator account has been created. You will receive an email confirmation shortly.');
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <OperatorOnboardingWizard
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};