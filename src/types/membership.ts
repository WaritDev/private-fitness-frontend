// Membership Types - อัปเดตให้ใช้ types ใหม่จาก customer-duration และ customer-session
// Re-export จาก files ใหม่เพื่อ backward compatibility

export type { MembershipStatus } from './product';
export type { 
  DurationMembership, 
  CustomerDuration, 
  DurationRegistrationData 
} from './customer-duration';
export type { 
  SessionMembership, 
  CustomerSession, 
  SessionRegistrationData 
} from './customer-session';