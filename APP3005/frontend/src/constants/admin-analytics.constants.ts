export const ADMIN_ANALYTICS_QUERY_KEYS = {
  OVERVIEW: ['admin-analytics', 'overview'],
  CREATORS_ANALYTICS: ['admin-analytics', 'creators'],
  CREATOR_DETAILS: (creatorId: string) => ['admin-analytics', 'creator', creatorId],
} as const;

export enum PayoutStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const ADMIN_ANALYTICS_TABS = {
  OVERVIEW: 'overview',
  CREATORS: 'creators',
};

export const DEFAULT_CURRENCY = 'INR';
