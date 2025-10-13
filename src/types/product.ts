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