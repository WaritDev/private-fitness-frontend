import React from 'react';
import { useRouter } from 'next/router';
import { Product } from '@/types/product';

const StepReview = ({ formData }) => {
  const router = useRouter();
  const { id } = router.query;

  const handleSubmit = async () => {
    const response = await fetch(`/api/durations/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle successful registration (e.g., redirect to a confirmation page)
      router.push(`/products/duration/${id}`);
    } else {
      // Handle error (e.g., show an error message)
      console.error('Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Review Your Registration</h2>
      <div>
        <h3>Duration Details</h3>
        <p>Price Paid: {formData.Price_Paid}</p>
        <p>Discount Amount: {formData.Discount_Amount}</p>
        <p>Purchase Date: {formData.Purchase_Date}</p>
        <p>Sales Username: {formData.Sales_Username}</p>
        <p>Start Date: {formData.Start_Date}</p>
        <p>End Date: {formData.End_Date}</p>
        <p>Duration ID: {formData.Duration_Id}</p>
        <p>Customer ID: {formData.Customer_Id}</p>
        <p>Product ID: {formData.Product_Id}</p>
        <p>Status: {formData.Status}</p>
      </div>
      <button onClick={handleSubmit} className="mt-4 btn btn-primary">
        Confirm Registration
      </button>
    </div>
  );
};

export default StepReview;