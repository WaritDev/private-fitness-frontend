import React from 'react';

const StepDurationDetails = ({ durationData, onChange }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Duration Details</h2>
      <div className="mb-4">
        <label htmlFor="pricePaid" className="block text-sm font-medium text-gray-700">
          Price Paid
        </label>
        <input
          type="number"
          id="pricePaid"
          value={durationData.Price_Paid}
          onChange={(e) => onChange({ ...durationData, Price_Paid: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700">
          Discount Amount
        </label>
        <input
          type="number"
          id="discountAmount"
          value={durationData.Discount_Amount}
          onChange={(e) => onChange({ ...durationData, Discount_Amount: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
          Purchase Date
        </label>
        <input
          type="date"
          id="purchaseDate"
          value={durationData.Purchase_Date}
          onChange={(e) => onChange({ ...durationData, Purchase_Date: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="salesUsername" className="block text-sm font-medium text-gray-700">
          Sales Username
        </label>
        <input
          type="text"
          id="salesUsername"
          value={durationData.Sales_Username}
          onChange={(e) => onChange({ ...durationData, Sales_Username: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={durationData.Start_Date}
          onChange={(e) => onChange({ ...durationData, Start_Date: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={durationData.End_Date}
          onChange={(e) => onChange({ ...durationData, End_Date: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="durationId" className="block text-sm font-medium text-gray-700">
          Duration ID
        </label>
        <input
          type="text"
          id="durationId"
          value={durationData.Duration_Id}
          onChange={(e) => onChange({ ...durationData, Duration_Id: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
          Customer ID
        </label>
        <input
          type="text"
          id="customerId"
          value={durationData.Customer_Id}
          onChange={(e) => onChange({ ...durationData, Customer_Id: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
          Product ID
        </label>
        <input
          type="text"
          id="productId"
          value={durationData.Product_Id}
          onChange={(e) => onChange({ ...durationData, Product_Id: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <input
          type="text"
          id="status"
          value={durationData.Status}
          onChange={(e) => onChange({ ...durationData, Status: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
    </div>
  );
};

export default StepDurationDetails;