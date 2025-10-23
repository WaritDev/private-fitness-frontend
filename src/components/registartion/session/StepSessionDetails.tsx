'use client';

import * as React from 'react';
import { TextField, Typography, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';
import { SessionRegistrationData } from '@/types/registration';

type Props = {
  productPrice?: number;                   // ราคาสินค้าตั้งต้น (ถ้ามี)
  onComputedPriceChange?: (n: number) => void;  // แจ้งราคาหลังลดให้ parent (optional)
  onAssignTrainer?: (username: string) => void; // แจ้ง trainer ที่ถูกสุ่ม (optional)
  onNext: (data: SessionRegistrationData) => void; // ไปขั้นตอนถัดไป
};

type Trainer = { username: string; name: string };

const MOCK_TRAINERS: Trainer[] = [
  { username: 'ethan_w', name: 'Ethan Walker' },
  { username: 'olivia_b', name: 'Olivia Bennett' },
  { username: 'noah_t', name: 'Noah Thompson' },
];

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

const StepSessionDetails: React.FC<Props> = (props) => {
  const { register, handleSubmit } = useForm<SessionRegistrationData>();

  const onSubmit = (data: SessionRegistrationData) => {
    props.onNext(data);
  };

  const basePrice = Number(props.productPrice ?? 0);
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [finalPrice, setFinalPrice] = React.useState<number>(basePrice);

  const [trainer, setTrainer] = React.useState<Trainer | null>(null);

  // สุ่มเทรนเนอร์อัตโนมัติเมื่อเข้า Step
  React.useEffect(() => {
    if (!MOCK_TRAINERS.length) return;
    const t = MOCK_TRAINERS[Math.floor(Math.random() * MOCK_TRAINERS.length)];
    setTrainer(t);
    props.onAssignTrainer?.(t.username);
  }, [props]);

  const applyDiscount = React.useCallback((percent: number) => {
    const p = Math.max(0, Math.min(7, Number.isFinite(percent) ? percent : 0)); // clamp 0..7
    const fp = Math.round(basePrice * (1 - p / 100));
    setDiscountPercent(p);
    setFinalPrice(fp);
    props.onComputedPriceChange?.(fp);
  }, [basePrice, props]);

  React.useEffect(() => {
    applyDiscount(0);
  }, [applyDiscount]);

  const onChangeDiscount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    applyDiscount(isNaN(v) ? 0 : v);
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

      {/* ส่วนลด (%), จำกัด 7% */}
      <TextField
        label="Discount Percentage (%)"
        type="number"
        inputProps={{ min: 0, max: 7, step: 0.5 }}
        value={discountPercent}
        onChange={onChangeDiscount}
        helperText="Max discount is 7%"
        fullWidth
      />

      <Typography variant="body2" color="text.secondary">
        Base Price: {money(basePrice)}
      </Typography>
      <Typography variant="subtitle1" fontWeight={800}>
        New Price: {money(finalPrice)}
      </Typography>

      {/* เทรนเนอร์ที่สุ่มแล้ว (ล็อกแก้ไข) */}
      <TextField
        label="Assigned Trainer"
        value={trainer ? `${trainer.name} (${trainer.username})` : ''}
        InputProps={{ readOnly: true }}
        helperText="Trainer assigned automatically"
        fullWidth
      />

      <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md">Next</button>
    </form>
  );
};

export default StepSessionDetails;