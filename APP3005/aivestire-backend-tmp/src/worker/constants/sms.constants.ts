/**
 * SMS Processor Constants
 *
 * Twilio-specific constants used by the SmsProcessor in the worker process.
 */

/**
 * Non-retriable Twilio error codes.
 *
 * These represent permanent failures where retrying the job will never succeed.
 * When the processor encounters one of these codes it discards the job immediately
 * instead of letting Bull apply exponential back-off — saving quota and queue slots.
 *
 * Reference: https://www.twilio.com/docs/api/errors
 */
export const NON_RETRIABLE_TWILIO_CODES = new Set<number>([
  21211, // Invalid 'To' phone number
  21214, // 'To' phone number cannot receive SMS
  21216, // Account not authorized to send to this region
  21408, // Permission to send an SMS has not been enabled
  21610, // Attempt to send to unsubscribed recipient
  21612, // Carrier does not support this message type
  21614, // 'To' number is not a valid mobile number
  21617, // Message body exceeds 1600 characters
  21619, // Message does not comply with carrier regulations
]);

/**
 * Maximum time (ms) the processor waits for Twilio to respond.
 * Bull hard-kills the job if it takes longer.
 */
export const SMS_JOB_TIMEOUT_MS = 30_000;

/**
 * Basic E.164 phone number regex.
 * Twilio requires E.164 format: +<country_code><subscriber_number>
 */
export const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
