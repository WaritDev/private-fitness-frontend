export type Trainer = {
  username: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  specialty: string;
  availability: Availability[];
};

export type Availability = {
  date: string; // YYYY-MM-DD format
  slots: Slot[];
};

export type Slot = {
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  isBooked: boolean;
};