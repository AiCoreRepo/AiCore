// ============================================
// PAYOUT CONSTANTS
// ============================================

export const PAYOUT_MESSAGES = {
  CREATED:          'Payout initiated successfully.',
  ALREADY_PROCESSED:'This payout has already been processed.',
  INSUFFICIENT:     'Payout amount exceeds the creator\'s pending balance.',
  INVALID_AMOUNT:   'Payout amount must be greater than zero.',
  CREATOR_NOT_FOUND:'Creator not found.',
  PAYOUT_NOT_FOUND: 'Payout record not found.',
  HASH_INVALID:     'Gateway callback signature verification failed.',
  CANCELLED:        'Payout cancelled successfully.',
} as const;

export const PAYOUT_TXN_PREFIX = 'PAY_'; // e.g., PAY_<8-char-creator-short>_<timestamp>
