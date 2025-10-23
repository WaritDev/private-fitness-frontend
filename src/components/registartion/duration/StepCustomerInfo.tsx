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
      <form>
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={customerInfo.customerName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={customerInfo.customerEmail}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={customerInfo.customerPhone}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
      </form>
    </div>
  );
};

export default StepCustomerInfo;