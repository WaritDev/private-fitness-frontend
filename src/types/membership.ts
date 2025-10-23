export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED' | 'COMPLETED';

export type DurationMembership = {
  title: string;           // เช่น Pro Yearly Membership
  endDate: string;         // ISO e.g. 2026-12-31T00:00:00Z or YYYY-MM-DD
  status: MembershipStatus;
};

export type SessionMembership = {
  title: string;           // เช่น 20 Personal Training Sessions
  totalSessions: number;
  usedSessions: number;
  status: MembershipStatus;
};