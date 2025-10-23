export type SessionRegistrationData = {
  Price_Paid: number;
  Discount_Amount?: number;
  Trainer_Username?: string;
  // optional fields (เผื่อ step อื่นใช้อยู่)
  Purchase_Date?: string;
  Sales_Username?: string;
  Start_Date?: string;
  End_Date?: string;
  Session_Id?: string;
  Customer_Username?: string;
  Product_Id?: string;
  Status?: string;
  Used_Sessions?: number;
  Total_Sessions?: number;
};

export type DurationRegistrationData = {
  Price_Paid: number;
  Discount_Amount?: number;
  // optional
  Purchase_Date?: string;
  Sales_Username?: string;
  Start_Date?: string;
  End_Date?: string;
  Customer_Username?: string;
  Product_Id?: string;
  Status?: string;
};