import React, { useState } from 'react';
import { useRouter } from 'next/router';
import DurationRegisterForm from './DurationRegisterForm';
import SessionRegisterForm from './SessionRegisterForm';

const Stepper = () => {
  const router = useRouter();
  const { id, type } = router.query; // Expecting type to be either 'duration' or 'session'
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    const response = await fetch(`/api/${type}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle successful registration (e.g., redirect or show a success message)
      router.push(`/products/${type}/${id}`);
    } else {
      // Handle error
      console.error('Registration failed');
    }
  };

  return (
    <div>
      {step === 0 && (
        <div>
          <h2>Customer Information</h2>
          {type === 'duration' ? (
            <DurationRegisterForm onNext={handleNext} />
          ) : (
            <SessionRegisterForm onNext={handleNext} />
          )}
        </div>
      )}
      {step === 1 && (
        <div>
          <h2>{type === 'duration' ? 'Duration Details' : 'Session Details'}</h2>
          {/* Render specific details form based on type */}
          {/* Add the respective detail form component here */}
          <button onClick={handleBack}>Back</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
};

export default Stepper;