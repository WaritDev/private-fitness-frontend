import React from 'react';

const StepCustomerInfo = ({ customerInfo, setCustomerInfo }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={customerInfo.customerName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={customerInfo.customerEmail}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium">
            Phone Number
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={customerInfo.customerPhone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default StepCustomerInfo;