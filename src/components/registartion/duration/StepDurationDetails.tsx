'use client';

import * as React from 'react';
import { TextField, Typography, Stack } from '@mui/material';

type Props = {
  productPrice?: number;                  // ราคาสินค้าตั้งต้น (ถ้ามี)
  onComputedPriceChange?: (n: number) => void; // แจ้งราคาหลังลดให้ parent (optional)
};

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function StepDurationDetails(props: Props) {
  const basePrice = Number(props.productPrice ?? 0);
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [finalPrice, setFinalPrice] = React.useState<number>(basePrice);

  const applyDiscount = React.useCallback((percent: number) => {
    const p = Math.max(0, Math.min(7, Number.isFinite(percent) ? percent : 0)); // clamp 0..7
    const fp = Math.round(basePrice * (1 - p / 100));
    setDiscountPercent(p);
    setFinalPrice(fp);
    props.onComputedPriceChange?.(fp);
  }, [basePrice, props]);

  // init once
  React.useEffect(() => {
    applyDiscount(0);
  }, [applyDiscount]);

  const onChangeDiscount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    applyDiscount(isNaN(v) ? 0 : v);
  };

  return (
    <Stack spacing={1.5}>
      <h2 className="text-lg font-semibold mb-4">Duration Details</h2>
      <div className="mb-4">
        <label htmlFor="pricePaid" className="block text-sm font-medium text-gray-700">
          Price Paid
        </label>
        <input
          type="number"
          id="pricePaid"
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={discountPercent}
          onChange={onChangeDiscount}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
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
          value={props.productPrice}
          onChange={(e) => props.onComputedPriceChange?.(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <Typography variant="body2" color="text.secondary">
        Base Price: {money(basePrice)}
      </Typography>
      <Typography variant="subtitle1" fontWeight={800}>
        New Price: {money(finalPrice)}
      </Typography>
    </Stack>
  );
}