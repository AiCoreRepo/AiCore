# PayU Payment Gateway Integration Guide

This document provides a simple, high-level overview of how the PayU Payment Gateway is integrated into both our backend and frontend applications.

## 1. High-Level Flow 🔄
PayU utilizes a **server-redirect (Form POST)** flow. The general lifecycle of a payment looks like this:

1. **User selects a payment method & places an order** on the frontend.
2. **Backend creates a transaction** and generates a **secure Hash** using the server-only `PAYU_SALT` and `PAYU_KEY`.
3. **Backend sends checkout payload** back to the frontend (which includes the hash and the PayU redirect URL).
4. **Frontend auto-submits a hidden form** to PayU's hosted checkout page.
5. **User completes payment** on PayU's secure site.
6. **PayU redirects the user back** to our success (`surl`) or failure (`furl`) URLs with payment details and a *reverse hash*.
7. **Backend verifies the reverse hash** securely to confirm the payment's authenticity before marking the order as paid.

---

## 2. Backend Integration 🛠️

The backend handles the most critical part of the payment integration: **Security and Cryptography**.
File Reference: `src/payment/services/payu-gateway.service.ts`

### Key Responsibilities:
- **Environment Values**: Utilizes `PAYU_KEY` and `PAYU_SALT` securely loaded from our `.env` variables.
- **Forward Hash Generation**:
  When a payment is initiated, the backend generates a SHA-512 hash using the formula:
  `sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)`
  This hash ensures that the payload hasn't been tampered with before reaching PayU.
- **Reverse Hash Verification**:
  When PayU calls our Success/Failure URL, they send back a reverse hash. The backend verifies it using:
  `sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)`
  If the calculated hash matches the received hash, the payment is legitimately authenticated.

---

## 3. Frontend Integration 💻

The frontend handles the user experience, payment method selection, and the seamless transition to PayU.
File References: `src/pages/PaymentPage.tsx` and `src/hooks/usePayU.ts`

### `PaymentPage.tsx`
- Gives users a beautiful interface to pick their preferred payment method: **UPI, Credit/Debit Cards, Net Banking, EMI, or Wallets**.
- Instead of just redirecting blindly, it optionally pre-selects the user's payment choice. It maps their selection to PayU's expected format:
  - `pg`: Payment group (e.g., `UPI`, `CC` for Credit Cards, `NB` for Netbanking).
  - `bankcode`: Specific bank or provider codes (e.g., `HDFC`, `PAYTM`, `PHONEPE`).

### `usePayU.ts` (Custom React Hook)
- **Invisible Form Submission**: Because PayU requires a POST request, this hook dynamically creates a `<form>` element in the DOM, populates it with hidden inputs including all fields returned by the backend (like `txnid`, `amount`, `hash`, `pg`, `bankcode`), and auto-submits it to `payload.action` (the PayU base URL).
- **Premium Loader Overlay**: While the form submits, the hook creates a secure custom "redirecting to PayU" screen (overlay) out of raw HTML/CSS. This calms the user, tells them not to refresh, and makes the redirect visually smooth.

---

## 4. Summary of Safety Guidelines Used 🔒
- The `PAYU_SALT` is **never passed to the frontend**.
- The frontend **never** generates the checksum/hash.
- Even if a user visits the `successUrl`, the server validates the hash sent in the payload before marking the order as successful.
