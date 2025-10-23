import React from 'react';
import { useForm } from 'react-hook-form';
import { SessionRegistrationData } from '@/types/registration';

const StepSessionDetails: React.FC<{ onNext: (data: SessionRegistrationData) => void }> = ({ onNext }) => {
  const { register, handleSubmit } = useForm<SessionRegistrationData>();

  const onSubmit = (data: SessionRegistrationData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="pricePaid" className="block text-sm font-medium text-gray-700">Price Paid</label>
        <input
          type="number"
          id="pricePaid"
          {...register('Price_Paid', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700">Discount Amount</label>
        <input
          type="number"
          id="discountAmount"
          {...register('Discount_Amount')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="trainerUsername" className="block text-sm font-medium text-gray-700">Trainer Username</label>
        <select
          id="trainerUsername"
          {...register('Trainer_Username', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          {/* Options should be populated dynamically */}
          <option value="">Select Trainer</option>
          <option value="trainer1">Trainer 1</option>
          <option value="trainer2">Trainer 2</option>
        </select>
      </div>

      <div>
        <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
        <input
          type="date"
          id="purchaseDate"
          {...register('Purchase_Date', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="salesUsername" className="block text-sm font-medium text-gray-700">Sales Username</label>
        <input
          type="text"
          id="salesUsername"
          {...register('Sales_Username', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          id="startDate"
          {...register('Start_Date', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="date"
          id="endDate"
          {...register('End_Date', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700">Session ID</label>
        <input
          type="text"
          id="sessionId"
          {...register('Session_Id', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="customerUsername" className="block text-sm font-medium text-gray-700">Customer Username</label>
        <input
          type="text"
          id="customerUsername"
          {...register('Customer_Username', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">Product ID</label>
        <input
          type="text"
          id="productId"
          {...register('Product_Id', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <input
          type="text"
          id="status"
          {...register('Status', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="usedSessions" className="block text-sm font-medium text-gray-700">Used Sessions</label>
        <input
          type="number"
          id="usedSessions"
          {...register('Used_Sessions', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="totalSessions" className="block text-sm font-medium text-gray-700">Total Sessions</label>
        <input
          type="number"
          id="totalSessions"
          {...register('Total_Sessions', { required: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>

      <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md">Next</button>
    </form>
  );
};

export default StepSessionDetails;