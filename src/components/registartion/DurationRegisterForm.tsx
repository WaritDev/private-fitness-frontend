import React, { useState } from 'react';

const DurationRegisterForm = () => {
  const [formData, setFormData] = useState({
    Price_Paid: '',
    Discount_Amount: '',
    Purchase_Date: '',
    Sales_Username: '',
    Start_Date: '',
    End_Date: '',
    Duration_Id: '',
    Customer_Id: '',
    Product_Id: '',
    Status: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add API call to submit the form data
    const response = await fetch('/api/durations/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle successful registration
      console.log('Registration successful');
    } else {
      // Handle error
      console.error('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Price Paid</label>
        <input type="number" name="Price_Paid" value={formData.Price_Paid} onChange={handleChange} required />
      </div>
      <div>
        <label>Discount Amount</label>
        <input type="number" name="Discount_Amount" value={formData.Discount_Amount} onChange={handleChange} />
      </div>
      <div>
        <label>Purchase Date</label>
        <input type="date" name="Purchase_Date" value={formData.Purchase_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>Sales Username</label>
        <input type="text" name="Sales_Username" value={formData.Sales_Username} onChange={handleChange} required />
      </div>
      <div>
        <label>Start Date</label>
        <input type="date" name="Start_Date" value={formData.Start_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>End Date</label>
        <input type="date" name="End_Date" value={formData.End_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>Duration ID</label>
        <input type="text" name="Duration_Id" value={formData.Duration_Id} onChange={handleChange} required />
      </div>
      <div>
        <label>Customer ID</label>
        <input type="text" name="Customer_Id" value={formData.Customer_Id} onChange={handleChange} required />
      </div>
      <div>
        <label>Product ID</label>
        <input type="text" name="Product_Id" value={formData.Product_Id} onChange={handleChange} required />
      </div>
      <div>
        <label>Status</label>
        <input type="text" name="Status" value={formData.Status} onChange={handleChange} required />
      </div>
      <button type="submit" className="btn">Register</button>
    </form>
  );
};

export default DurationRegisterForm;