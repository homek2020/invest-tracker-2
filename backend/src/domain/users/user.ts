export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserProfile {
  baseCurrency: CurrencyCode;
  locale: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  profile: UserProfile;
  status: UserStatus;
}

export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'GBP';
