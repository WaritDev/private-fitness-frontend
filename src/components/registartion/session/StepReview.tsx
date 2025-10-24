import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { SessionRegistrationData } from '@/types/registration';

const StepReview = ({ formData }: { formData: SessionRegistrationData }) => {
  const router = useRouter();

  const handleSubmit = async () => {
    const res = await fetch('/api/sessions/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push('/success'); // Redirect to a success page or similar
    } else {
      // Handle error
      console.error('Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Review Your Session Registration</h2>
      <div className="mb-4">
        <h3>Session Details</h3>
        <p><strong>Price Paid:</strong> {formData.Price_Paid}</p>
        <p><strong>Discount Amount:</strong> {formData.Discount_Amount}</p>
        <p><strong>Trainer Username:</strong> {formData.Trainer_Username}</p>
        <p><strong>Purchase Date:</strong> {formData.Purchase_Date}</p>
        <p><strong>Sales Username:</strong> {formData.Sales_Username}</p>
        <p><strong>Start Date:</strong> {formData.Start_Date}</p>
        <p><strong>End Date:</strong> {formData.End_Date}</p>
        <p><strong>Session ID:</strong> {formData.Session_Id}</p>
        <p><strong>Customer Username:</strong> {formData.Customer_Username}</p>
        <p><strong>Product ID:</strong> {formData.Product_Id}</p>
        <p><strong>Status:</strong> {formData.Status}</p>
        <p><strong>Used Sessions:</strong> {formData.Used_Sessions}</p>
        <p><strong>Total Sessions:</strong> {formData.Total_Sessions}</p>
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">Confirm Registration</button>
    </div>
  );
};

export default StepReview;