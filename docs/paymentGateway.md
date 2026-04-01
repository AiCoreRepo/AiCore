I have an existing NestJS backend project with a payment module that currently uses Razorpay in test mode.

I do NOT want to change the folder structure or repository pattern. I already have a payment folder with:

* payment.service.ts
* payment.controller.ts
* payment.repository.ts (repo pattern)
* payment.entity.ts

Your task is to REPLACE Razorpay integration with PayU integration while keeping the existing structure intact.

### Requirements:

1. Remove all Razorpay-specific logic:

   * order creation
   * Razorpay SDK usage
   * signature verification

2. Implement PayU payment flow inside the same files:

   * Generate txnId (unique transaction ID)
   * Generate hash using SHA-512 (key + txnId + amount + productinfo + firstname + email + salt)
   * Return payment payload for frontend redirection

3. Update payment.service.ts:

   * Add method to initiate PayU payment
   * Save payment as PENDING in database using repository
   * Add success and failure handlers
   * Verify PayU response hash before marking SUCCESS

4. Maintain idempotency:

   * Prevent duplicate transactions using txnId or idempotencyKey
   * Do not update payment if already SUCCESS

5. Update payment.controller.ts:

   * POST /payment/initiate → returns PayU payload
   * POST /payment/success → handle success
   * POST /payment/failure → handle failure

6. Frontend changes:

   * Replace Razorpay checkout with HTML form submission to PayU
   * Auto-submit form using returned payload (key, txnid, hash, etc.)

7. Keep everything production-safe:

   * Use environment variables for PAYU_KEY and PAYU_SALT
   * Validate hash in backend
   * Do not trust frontend response

8. Do NOT create new folders or change architecture.
   Only modify existing service, controller, and integration logic.

9. Provide complete updated code for:

   * payment.service.ts
   * payment.controller.ts
   * frontend redirection form example

Make sure the code is clean, production-ready, and follows NestJS best practices.
