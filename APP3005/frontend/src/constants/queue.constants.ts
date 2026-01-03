/**
 * Job Status Constants (matching backend)
 * These represent the state of background jobs in Redis
 */
export const JOB_STATUS = {
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    FAILED: 'failed',
    NOT_FOUND: 'not_found',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];
