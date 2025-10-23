import React, { useState } from 'react';

interface SessionRegisterFormProps {
  sessionId: string | string[] | undefined;
}

const SessionRegisterForm = ({ sessionId }: SessionRegisterFormProps) => {
  const [formData, setFormData] = useState({
    Price_Paid: '',
    Discount_Amount: '',
    Trainer_Username: '',
    Purchase_Date: '',
    Sales_Username: '',
    Start_Date: '',
    End_Date: '',
    Session_Id: '',
    Customer_Username: '',
    Product_Id: '',
    Status: '',
    Used_Sessions: '',
    Total_Sessions: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add API call to submit the form data
    const response = await fetch('/api/sessions/purchase', {
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
      // Handle registration error
      console.error('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Price Paid:</label>
        <input type="number" name="Price_Paid" value={formData.Price_Paid} onChange={handleChange} required />
      </div>
      <div>
        <label>Discount Amount:</label>
        <input type="number" name="Discount_Amount" value={formData.Discount_Amount} onChange={handleChange} />
      </div>
      <div>
        <label>Trainer Username:</label>
        <select name="Trainer_Username" value={formData.Trainer_Username} onChange={handleChange} required>
          <option value="">Select Trainer</option>
          {/* Add trainer options here */}
        </select>
      </div>
      <div>
        <label>Purchase Date:</label>
        <input type="date" name="Purchase_Date" value={formData.Purchase_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>Sales Username:</label>
        <input type="text" name="Sales_Username" value={formData.Sales_Username} onChange={handleChange} required />
      </div>
      <div>
        <label>Start Date:</label>
        <input type="date" name="Start_Date" value={formData.Start_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>End Date:</label>
        <input type="date" name="End_Date" value={formData.End_Date} onChange={handleChange} required />
      </div>
      <div>
        <label>Session ID:</label>
        <input type="text" name="Session_Id" value={formData.Session_Id} onChange={handleChange} required />
      </div>
      <div>
        <label>Customer Username:</label>
        <input type="text" name="Customer_Username" value={formData.Customer_Username} onChange={handleChange} required />
      </div>
      <div>
        <label>Product ID:</label>
        <input type="text" name="Product_Id" value={formData.Product_Id} onChange={handleChange} required />
      </div>
      <div>
        <label>Status:</label>
        <input type="text" name="Status" value={formData.Status} onChange={handleChange} required />
      </div>
      <div>
        <label>Used Sessions:</label>
        <input type="number" name="Used_Sessions" value={formData.Used_Sessions} onChange={handleChange} required />
      </div>
      <div>
        <label>Total Sessions:</label>
        <input type="number" name="Total_Sessions" value={formData.Total_Sessions} onChange={handleChange} required />
      </div>
      <button type="submit">Register Session</button>
    </form>
  );
};

export default SessionRegisterForm;