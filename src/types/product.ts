export type Product = {
  Product_Id: number;
  Name: string;
  Product_Type: 'DURATION' | 'SESSION';
  Product_Category: 'Economy' | 'Business' | 'First_Class';
  Price: number;               // mapped from List_Price
  Duration_Days: number | null;
  Session_Amount: number | null;
  Is_Active: boolean;
};

export type Status = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED';

export type Gender = '' | 'Male' | 'Female' | 'Other';

export type CustomerBaseInfo = {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string | null; // YYYY-MM-DD or null
  phone: string;
  email: string | null;
};

export type Credentials = {
  username: string;
  password: string;
};

export type DurationPurchaseRequest = {
  productId: number;
  customerUsername: string;
  pricePaid: number;
  discountAmount: number;
};

export type SessionPurchaseRequest = {
  productId: number;
  customerUsername: string;
  pricePaid: number;
  discountAmount: number;
  trainerUsername: string;
};

export type Duration = {
  Name: string;
  Price: number;
  Duration_Days: number;
  Product_Category: 'Economy' | 'Business' | 'First_Class';
   
}
