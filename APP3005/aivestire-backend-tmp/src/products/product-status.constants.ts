export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
