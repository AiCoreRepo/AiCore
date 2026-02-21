export const ADMIN_MESSAGES = {
  ERRORS: {
    PRODUCT_NOT_FOUND: 'Product not found',
    INVALID_ACTION: 'Invalid approval action',
    COMMENT_REQUIRED_FOR_REJECTION:
      'Comment is required when rejecting a product',
    UNAUTHORIZED: 'Insufficient permissions',
  },
  SUCCESS: {
    PRODUCT_APPROVED: 'Product approved successfully',
    PRODUCT_REJECTED: 'Product rejected successfully',
  },
} as const;

export const ADMIN_DEFAULTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },
} as const;
