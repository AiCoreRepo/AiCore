export const ADMIN_MESSAGES = {
  ERRORS: {
    PRODUCT_NOT_FOUND: 'Product not found',
    INVALID_ACTION: 'Invalid approval action',
    COMMENT_REQUIRED_FOR_REJECTION:
      'Comment is required when rejecting a product',
    UNAUTHORIZED: 'Insufficient permissions',
    CREATOR_NOT_FOUND: 'Creator not found',
    INVALID_CREATOR_STATUS: 'Invalid creator status action',
  },
  SUCCESS: {
    PRODUCT_APPROVED: 'Product approved successfully',
    PRODUCT_REJECTED: 'Product rejected successfully',
    CREATOR_ACTIVATED: 'Creator activated successfully',
    CREATOR_DEACTIVATED: 'Creator deactivated successfully',
  },
} as const;

export const ADMIN_DEFAULTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },
} as const;

export const CREATOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

