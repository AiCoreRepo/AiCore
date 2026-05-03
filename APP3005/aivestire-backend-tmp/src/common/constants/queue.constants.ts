/**
 * Bull Queue Job Status Constants
 * These represent the state of background jobs in Redis
 */
export const JOB_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NOT_FOUND: 'not_found',
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  AURA_GENERATION: 'aura-generation',
  TRY_ON_PROCESSING: 'try-on-processing',
  ANGLES_GENERATION: 'angles-generation',
  SMS_NOTIFICATIONS: 'sms-notifications',
} as const;

/**
 * Job Names
 */
export const JOB_NAMES = {
  GENERATE_AVATARS: 'generate-avatars',
  PROCESS_DIRECT_TRY_ON: 'process-direct-try-on',
  PROCESS_ANGLE_GENERATION: 'process-angle-generation',
  ORDER_CONFIRMATION_SMS: 'order-confirmation-sms',
  ADMIN_ORDER_ALERT_SMS: 'admin-order-alert-sms',
  CREATOR_UPLOAD_SMS: 'creator-upload-sms',
} as const;
