# Order Status and Payment Test Cases

## Scope

This document covers deep test coverage for:

- Core order lifecycle
- Order cancellation
- COD handling
- Return flow
- Replacement flow
- Refund flow
- PayU payment flow
- Security, idempotency, and concurrency edge cases

Primary code references:

- `APP3005/aivestire-backend-tmp/src/order/services/order.service.ts`
- `APP3005/aivestire-backend-tmp/src/order/services/order-state-machine.service.ts`
- `APP3005/aivestire-backend-tmp/src/payment/services/payment.service.ts`
- `APP3005/aivestire-backend-tmp/src/payment/payment.repository.ts`
- `APP3005/aivestire-backend-tmp/src/return/return.service.ts`
- `APP3005/aivestire-backend-tmp/src/replace/replace.service.ts`
- `APP3005/aivestire-backend-tmp/src/refund/refund.service.ts`
- `APP3005/aivestire-backend-tmp/prisma/schema.prisma`

## Status Models

### Order status

`PENDING -> BOOKED -> DISPATCHED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED`

Cancellation is allowed only from:

- `PENDING`
- `BOOKED`
- `DISPATCHED`

Terminal states:

- `DELIVERED`
- `CANCELLED`

### Payment status

Order-level payment status:

- `PENDING`
- `COMPLETED`
- `FAILED`
- `REFUNDED`

Payment transaction status:

- `CREATED`
- `ATTEMPTED`
- `AUTHORIZED`
- `CAPTURED`
- `FAILED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`
- `CANCELLED`

### Return status

`REQUESTED -> APPROVED -> PICKUP_SCHEDULED -> PICKED_UP -> QC_PASSED -> COMPLETED`

Alternate end states:

- `REJECTED`
- `QC_FAILED`

### Replacement status

`REQUESTED -> APPROVED -> PICKUP_SCHEDULED -> PICKED_UP -> DISPATCHED -> DELIVERED -> COMPLETED`

Alternate end state:

- `REJECTED`

### Refund status

`PENDING_REVIEW -> PROCESSING -> COMPLETED`

Alternate paths:

- `PENDING_REVIEW -> REJECTED`
- `PENDING_REVIEW -> ARCHIVED`
- `PROCESSING -> FAILED`

## Test Data Baseline

Prepare these reusable fixtures before execution:

- User A with valid shipping address and cart
- User B for unauthorized-access scenarios
- Admin user
- Delivery partner user
- Approved product with enough inventory
- Approved product with low inventory
- Deleted or non-approved product
- Prepaid order in `PENDING`
- COD order in `BOOKED`
- Wallet order with sufficient balance
- Wallet order with insufficient balance
- Delivered prepaid order within 7 days
- Delivered prepaid order older than 7 days
- Cancelled prepaid order
- Returned order in `QC_PASSED`
- PayU sandbox callback payloads with valid and invalid hashes

## 1. Order Creation and Core Lifecycle

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| ORD-01 | Create prepaid order | Call `POST /orders` with valid items, approved products, valid address, `paymentMethod=PAYU` or `PREPAID` | Order created with `current_status=PENDING`, `payment_status=PENDING`, no inventory deduction, status history starts with `PENDING` |
| ORD-02 | Create COD order | Call `POST /orders` with valid data and `paymentMethod=COD` | Order created with `current_status=BOOKED`, `payment_status=PENDING`, inventory deducted, `order_items.order_status=BOOKED`, status history has `PENDING` and `BOOKED` |
| ORD-03 | Create wallet order | Call `POST /orders` with valid data and `paymentMethod=WALLET` | Order created with `current_status=BOOKED`, `payment_status=COMPLETED`, wallet debited, wallet transaction created, inventory deducted |
| ORD-04 | Wallet balance insufficient | Use wallet user with balance below order total | Request fails, no order created, no wallet debit, no inventory change |
| ORD-05 | Invalid shipping address | Use address not owned by user or fake UUID | Request fails with validation/business error |
| ORD-06 | Product missing or not approved | Include deleted, unapproved, or nonexistent product in order | Request fails, no partial order creation |
| ORD-07 | Insufficient inventory at order creation | Request quantity greater than `inventory_count` | Request fails, no inventory deduction |
| ORD-08 | Invalid payload | Empty items array, invalid UUID, quantity `0`, invalid enum payment method | DTO validation error |
| ORD-09 | Valid coupon applied | Submit eligible coupon code | Discount applied, total reduced, coupon usage increments |
| ORD-10 | Invalid or expired coupon | Submit invalid, expired, inactive, or min-order-failing coupon | Order still creates, coupon not applied, no usage increment |
| ORD-11 | Prepaid payment success moves order to BOOKED | Complete PayU success callback for `PENDING` order | Order becomes `BOOKED`, payment becomes `COMPLETED`, inventory deducted once, history entry `PENDING -> BOOKED` added |
| ORD-12 | Admin updates BOOKED to DISPATCHED | `POST /orders/:id/status` as admin with `status=DISPATCHED` | Order and all order items move to `DISPATCHED`, history row added |
| ORD-13 | Admin updates DISPATCHED to SHIPPED | Set `status=SHIPPED`, include tracking number | Order status updated, tracking stored, order shipped event emitted |
| ORD-14 | Delivery partner updates SHIPPED to OUT_FOR_DELIVERY | Call status API as delivery partner | Allowed, history row added |
| ORD-15 | Delivery partner updates OUT_FOR_DELIVERY to DELIVERED | Call status API as delivery partner | Allowed, status becomes `DELIVERED`, event emitted |
| ORD-16 | Invalid forward jump by non-admin | Try `PENDING -> SHIPPED` or `BOOKED -> DELIVERED` as non-admin | Request rejected as invalid transition |
| ORD-17 | Change from terminal state by non-admin | Try to update `DELIVERED` or `CANCELLED` order | Request rejected |
| ORD-18 | Admin override of transition | Admin moves order from any state to any other state | Current implementation allows override; verify update, history, and side effects |
| ORD-19 | Delivery partner forbidden statuses | Delivery partner tries `BOOKED`, `DISPATCHED`, or `CANCELLED` | Request rejected |
| ORD-20 | Idempotent same-status update with no metadata | Send same current status and no extra fields | Service returns current order without new history row |
| ORD-21 | Same-status update with metadata | Send same current status plus tracking or notes | Metadata is updated and history row is created |
| ORD-22 | Order history ordering | Fetch tracking after multiple transitions | `status_history` returned oldest to newest |
| ORD-23 | User order list ordering | Call `GET /orders/my-orders` | Orders returned newest first |
| ORD-24 | Unauthorized order read | User B reads User A order via `GET /orders/:id` or `/tracking` | Request rejected |

## 2. Cancellation and Inventory Rollback

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| CAN-01 | Cancel `PENDING` prepaid order | User calls `POST /orders/:id/cancel` | Order becomes `CANCELLED`, cancellation fields stored, history row added, inventory stays not deducted |
| CAN-02 | Cancel `BOOKED` order | Cancel booked COD or wallet order | Order becomes `CANCELLED`, deducted inventory is restored |
| CAN-03 | Cancel `DISPATCHED` order | Cancel dispatched order | Allowed by current state machine, order becomes `CANCELLED`, inventory restored |
| CAN-04 | Cancel `SHIPPED` order | Try cancel after shipping | Rejected |
| CAN-05 | Cancel `OUT_FOR_DELIVERY` order | Try cancel after OOD | Rejected |
| CAN-06 | Cancel `DELIVERED` order | Try cancel delivered order | Rejected with return guidance |
| CAN-07 | Cancel already cancelled order | Repeat cancel request | Rejected |
| CAN-08 | Short cancellation reason | Reason below min length or invalid payload | DTO validation error |
| CAN-09 | Inventory restored exactly once | Cancel same booked order twice or retry after failure | No double-restoration, second request rejected |

## 3. COD-Specific Cases

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| COD-01 | Collect COD for valid COD order | Call `POST /orders/:id/cod-collect` with valid collector UUID | `cod_collected=true`, timestamp and collector stored |
| COD-02 | Collect COD for non-COD order | Call COD collect on prepaid order | Rejected |
| COD-03 | Collect COD twice | Repeat COD collect request | Rejected |
| COD-04 | Deliver COD without collection | Non-admin tries `OUT_FOR_DELIVERY -> DELIVERED` while `cod_collected=false` | Rejected |
| COD-05 | Deliver COD after collection | Collect COD, then mark delivered | Allowed, order `payment_status=COMPLETED` |
| COD-06 | Admin override COD delivery | Admin marks COD order delivered without collection | Current implementation allows it; verify whether this is acceptable business behavior |
| COD-07 | COD amount mismatch exploratory | Send `collectedAmount` lower or higher than order total | Expected business result should reject; current service does not validate amount |
| COD-08 | COD collect authorization exploratory | User B or delivery partner tries COD collect on someone else’s order | Expected business result should reject; verify current permission enforcement |

## 4. Return Flow

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| RET-01 | Request return within window | User requests return on delivered order within 7 days | `order_return` created with `REQUESTED`, `order.return_status=REQUESTED` |
| RET-02 | Request return on non-delivered order | Use `BOOKED`, `SHIPPED`, or `CANCELLED` order | Rejected |
| RET-03 | Return after 7-day window | Use delivered order older than 7 days | Rejected |
| RET-04 | Return by non-owner | User B requests return for User A order | Rejected |
| RET-05 | Duplicate active return | Existing order return in `REQUESTED`, `APPROVED`, or `PICKUP_SCHEDULED` | Rejected |
| RET-06 | Return blocked when replacement exists | Original order already has `replace_status` set | Rejected |
| RET-07 | Admin approves return | `POST /returns/:returnId/approve` on `REQUESTED` return | Return and order status move to `APPROVED` |
| RET-08 | Admin rejects return | Reject `REQUESTED` return with reason | Return and order status move to `REJECTED`, rejection reason stored |
| RET-09 | Schedule pickup from approved state | Call schedule-pickup on approved return | Status becomes `PICKUP_SCHEDULED`, pickup fields stored |
| RET-10 | Schedule pickup from wrong state | Schedule pickup before approval | Rejected |
| RET-11 | Mark picked up | Mark return picked up from `PICKUP_SCHEDULED` | Status becomes `PICKED_UP` on both return and order |
| RET-12 | QC pass | Complete QC with `qc_passed=true` | Status becomes `QC_PASSED`, refund auto-initiation attempted |
| RET-13 | QC fail | Complete QC with `qc_passed=false` | Status becomes `QC_FAILED`, no refund initiated |
| RET-14 | Complete return after QC pass | Call `/returns/:returnId/complete` | Status becomes `COMPLETED` on return and order |
| RET-15 | Complete return before QC pass | Try complete from `REQUESTED`, `APPROVED`, `PICKED_UP`, or `QC_FAILED` | Rejected |
| RET-16 | Latest return details | Multiple return records for same order | Latest by `requested_at` returned |
| RET-17 | Auto refund after QC pass | After QC pass, verify refund record | Refund enters `PENDING_REVIEW` if prepaid order is eligible |
| RET-18 | COD return refund block | QC-pass a COD return | Refund auto-initiation should fail because COD refund is disallowed by current service |
| RET-19 | Re-request return after completion exploratory | Request return again after prior `COMPLETED` or `QC_FAILED` | Expected business result should reject; current duplicate guard may allow this |
| RET-20 | Delivery-window timestamp logic exploratory | Update delivered order after delivery, then request return | Verify 7-day rule uses actual delivery time; current code uses `order.updated_at` |

## 5. Replacement Flow

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| REP-01 | Request replacement within window | User requests replacement on delivered order within 7 days | Replacement record created with `REQUESTED`, `order.replace_status=REQUESTED` |
| REP-02 | Replacement on non-delivered order | Use order not in `DELIVERED` | Rejected |
| REP-03 | Replacement after 7 days | Use delivered order older than 7 days | Rejected |
| REP-04 | Replacement by non-owner | User B requests replacement | Rejected |
| REP-05 | Duplicate active replacement | Existing replacement in `REQUESTED`, `APPROVED`, or `PICKUP_SCHEDULED` | Rejected |
| REP-06 | Replacement blocked when return exists | Order already has `return_status` set | Rejected |
| REP-07 | Approve replacement | Admin approves `REQUESTED` replacement | Replacement becomes `APPROVED`, new replacement order created and linked |
| REP-08 | Verify replacement order fields | Inspect newly created replacement order | New order has `payment_status=COMPLETED`, `current_status=PENDING`, copied items and shipping address |
| REP-09 | Reject replacement | Admin rejects `REQUESTED` replacement | Replacement and order become `REJECTED` |
| REP-10 | Schedule pickup | Schedule pickup for approved replacement | Status becomes `PICKUP_SCHEDULED`, pickup details stored |
| REP-11 | Mark original item picked up | Mark picked up | Status becomes `PICKED_UP` |
| REP-12 | Dispatch replacement | Dispatch replacement with tracking | Original order `replace_status=DISPATCHED`, replacement status `DISPATCHED`, new order moves to `SHIPPED` with tracking |
| REP-13 | Deliver replacement | Mark delivered | Original order `replace_status=DELIVERED`, new replacement order becomes `DELIVERED` |
| REP-14 | Complete replacement | Complete after delivered | Status becomes `COMPLETED` |
| REP-15 | Complete replacement too early | Complete before `DELIVERED` | Rejected |
| REP-16 | Replacement detail lookup | Call `GET /replacements/order/:orderId` | Latest replacement record returned |
| REP-17 | Replacement state-guard exploratory: picked up | Try `mark-picked-up` before approval or pickup scheduling | Expected business result should reject; current service lacks explicit state validation |
| REP-18 | Replacement state-guard exploratory: dispatched | Try dispatch from `REQUESTED` or `APPROVED` without pickup completion | Expected business result should reject; current service lacks explicit state validation |
| REP-19 | Replacement state-guard exploratory: delivered | Try delivered before dispatch | Expected business result should reject; current service lacks explicit state validation |
| REP-20 | Replacement inventory consistency exploratory | Approve and dispatch replacement | Verify replacement order inventory and status history stay consistent with original order rules |

## 6. Refund Flow

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| REF-01 | User refund on cancelled prepaid order | Call `POST /refunds/:orderId` for cancelled prepaid order | Refund created in `PENDING_REVIEW`, `order.refund_status=PENDING_REVIEW`, amount copied from order |
| REF-02 | User refund on QC-passed return | Use order with `return_status=QC_PASSED` or `COMPLETED` | Refund created in `PENDING_REVIEW` |
| REF-03 | COD refund request | Attempt refund for COD order | Rejected |
| REF-04 | Already refunded order | Refund order with `payment_status=REFUNDED` | Rejected |
| REF-05 | Duplicate active refund | Existing refund in `PENDING_REVIEW`, `INITIATED`, or `PROCESSING` | Rejected |
| REF-06 | Ineligible refund state | Refund order that is neither cancelled nor return-approved | Rejected |
| REF-07 | Admin initiate refund | Use `POST /refunds/admin/initiate/:orderId` | Refund created or existing active refund returned |
| REF-08 | Admin trigger PayU refund success | Process refund from `PENDING_REVIEW` with successful PayU response | Refund `PROCESSING -> COMPLETED`, order `payment_status=REFUNDED` |
| REF-09 | PayU API network failure | Simulate network error during process | Refund marked `FAILED` |
| REF-10 | PayU refund failure | Simulate failed PayU API response | Refund marked `FAILED` |
| REF-11 | Manual-follow-up PayU response | Simulate response containing `purged`, `manual follow-up`, or similar keywords | Refund reset to `PENDING_REVIEW` for manual processing |
| REF-12 | Admin reject refund | Reject refund from `PENDING_REVIEW` | Refund and order become `REJECTED` |
| REF-13 | Reject from wrong state | Try reject from `PROCESSING`, `COMPLETED`, or `ARCHIVED` | Rejected |
| REF-14 | Archive refund | Archive refund from `PENDING_REVIEW` | Refund and order become `ARCHIVED` |
| REF-15 | Archive from wrong state | Try archive after process start | Rejected |
| REF-16 | Confirm refund success manually | Complete refund from `PROCESSING` | Refund becomes `COMPLETED`, order payment becomes `REFUNDED` |
| REF-17 | Confirm success from wrong state | Try complete from `PENDING_REVIEW`, `FAILED`, or `REJECTED` | Rejected |
| REF-18 | Webhook success | Send webhook with matching `mihpayid` or `refundId` and success status | Refund marked `COMPLETED`, idempotent on repeat |
| REF-19 | Webhook failure | Send webhook with failure status | Refund marked `FAILED` |
| REF-20 | Webhook unknown status | Send unknown `status` string | Webhook ignored with no state change |
| REF-21 | Webhook missing identifiers | Omit both `mihpayid` and refund id | Webhook ignored |
| REF-22 | Webhook already terminal | Send webhook for already `COMPLETED` or `FAILED` refund | No state downgrade or duplicate completion |
| REF-23 | Return/refund linkage | Complete refund for returned order | Order `return_status` may be completed by current service if not already terminal |
| REF-24 | Replacement/refund linkage | Complete refund for order with active replacement | Order `replace_status` may be completed by current service if active |
| REF-25 | Refund source behavior | Complete prepaid refund | Verify no wallet credit happens in refund completion path; refund goes to original source per service design |

## 7. Payment and PayU Flow

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| PAY-01 | Initiate payment for valid prepaid order | Call `POST /payments/initiate` as order owner | `payment_transaction` created with `CREATED`, payload returned with `txnid`, `hash`, `surl`, `furl`, `action`, `udf1=orderId` |
| PAY-02 | Initiate payment for another user’s order | User B initiates User A order payment | Rejected |
| PAY-03 | Initiate payment for already paid order | Order already `payment_status=COMPLETED` | Conflict error |
| PAY-04 | Initiate payment with active captured or authorized txn | Existing active payment transaction present | Conflict error |
| PAY-05 | Re-initiate after failed attempt | Existing latest transaction is `FAILED`, order not completed | New initiation allowed by current repository rules |
| PAY-06 | Amount lower than minimum | Order total below `1` | Rejected |
| PAY-07 | Amount above maximum | Order total above `500000` | Rejected |
| PAY-08 | Success callback happy path | POST valid PayU success payload with valid hash and known `txnid` | Transaction `CAPTURED`, order `BOOKED`, payment `COMPLETED`, success redirect issued |
| PAY-09 | Success callback idempotency | Replay same success callback | No double capture, no double inventory deduction, response still success |
| PAY-10 | Success callback invalid hash | Tamper callback hash | Request rejected, controller redirects to failure page |
| PAY-11 | Success callback non-success status | Send status other than `success` to success endpoint | Rejected |
| PAY-12 | Success callback unknown txnid | Use nonexistent transaction ID | Not found / failure redirect |
| PAY-13 | Failure callback happy path | POST valid failure payload and valid hash | Transaction marked `FAILED`, order `payment_status=FAILED`, failure redirect issued |
| PAY-14 | Failure callback after capture | Send failure callback after a successful capture | Captured payment is not downgraded |
| PAY-15 | Failure callback invalid hash | Send invalid hash to failure endpoint | Service rejects; controller still redirects to failure page |
| PAY-16 | Payment status API for owner | `GET /payments/status/:orderId` as owner | Latest transaction details returned with order payment and order status |
| PAY-17 | Payment status API for non-owner | User B calls payment status for User A order | Rejected |
| PAY-18 | Payment status API before transaction | Query order with no payment transaction | Not found |
| PAY-19 | Legacy DB-only payment refund endpoint | Call `POST /payments/refund` for owner with captured PayU transaction | Transaction becomes `REFUNDED`, order `payment_status=REFUNDED`, `refund_status=INITIATED`, `refund_amount` set |
| PAY-20 | Legacy payment refund without captured transaction | Use order without captured PayU transaction | Not found |
| PAY-21 | Redirect query parameters | Complete success and failure callbacks | Frontend redirects include `orderId`, `orderNumber`, `txnid`, or failure reason as expected |
| PAY-22 | PayU payload hash integrity | Inspect checkout payload | Forward hash matches server formula, frontend never computes hash |

## 8. Security, Permission, and Concurrency Cases

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| SEC-01 | Status update role enforcement | Normal user calls `POST /orders/:id/status` | Rejected |
| SEC-02 | Admin order list access | Non-admin calls `GET /orders/all` | Rejected |
| SEC-03 | Return admin endpoints | Non-admin calls approve, reject, schedule, QC, or complete endpoints | Rejected |
| SEC-04 | Replacement admin endpoints | Non-admin calls approve, reject, dispatch, or complete endpoints | Rejected |
| SEC-05 | Refund admin endpoints | User JWT calls admin refund endpoints | Rejected |
| SEC-06 | Spoofed PayU success callback | Send success callback with tampered hash | Rejected |
| SEC-07 | Spoofed PayU failure callback | Send failure callback with tampered hash | Rejected by service |
| SEC-08 | Refund webhook spoofing exploratory | Call `/refunds/webhook/payu` directly with matching identifiers and forged status | Expected business result should verify authenticity; current implementation does not verify webhook signature/hash |
| SEC-09 | Parallel payment initiation race | Fire two `POST /payments/initiate` requests concurrently for same order | Expected business result should create one active attempt; verify whether multiple `CREATED` rows are produced |
| SEC-10 | Parallel success callbacks | Send same PayU success callback concurrently | Only one capture and one inventory deduction should occur |
| SEC-11 | Cancel vs payment-success race | Trigger cancel and payment success nearly simultaneously | Final state should be deterministic, inventory and payment status should stay consistent |
| SEC-12 | Refund process retry | Retry admin refund processing after `FAILED` | Current implementation allows retry from `FAILED`; verify single final completed refund |

## 9. UI and Integration Regression Cases

| ID | Scenario | Setup / Steps | Expected Result |
| --- | --- | --- | --- |
| UI-01 | Pending order rendering | Load frontend My Orders page for backend `PENDING` order | UI should render a stable label and badge for `PENDING` |
| UI-02 | Timeline mapping for pending | Open order details for `PENDING` order | Timeline should not break even though frontend also defines `ORDER_PLACED` |
| UI-03 | Cancelled order timeline | Open cancelled order | Timeline should show cancellation state without rendering later steps as active |
| UI-04 | Return badge rendering | Use each `return_status` value | Correct text and styling shown for each state |
| UI-05 | Replacement badge rendering | Use each `replace_status` value | Correct text and styling shown for each state |
| UI-06 | Payment badge rendering | Use each `payment_status` value | Correct payment badge text and color shown |
| UI-07 | Payment redirect pages | Complete success and failure callback flows | `PaymentSuccessPage` and `PaymentFailurePage` read query parameters correctly |

## 10. High-Risk Cases to Run First

If time is limited, prioritize these:

1. `ORD-11`, `PAY-08`, `PAY-09`, `PAY-13`
2. `CAN-02`, `CAN-03`, `COD-04`, `COD-05`
3. `RET-12`, `RET-17`, `REF-08`, `REF-18`
4. `REP-07`, `REP-12`, `REP-17`, `REP-18`
5. `SEC-08`, `SEC-09`, `SEC-10`, `SEC-11`

## 11. Known Implementation-Sensitive Areas

These are especially worth validating because the code paths are fragile or permissive:

- Generic order status API can also change `payment_status`, `return_status`, and `replace_status` without dedicated lifecycle validation.
- COD collection does not validate `collectedAmount` against order total.
- Return and replacement eligibility windows currently use `order.updated_at`, not an explicit delivered timestamp.
- Replacement service has missing state guards on some transition endpoints.
- Refund webhook currently acts as a source-of-truth updater without visible signature verification.
- Frontend order status types include `ORDER_PLACED` and `PENDING_APPROVAL`, while backend core order enum uses `PENDING`.

## 12. UI Execution Steps

This section translates the main test areas into real frontend actions.

### Customer UI entry points

- Browse products: `/collection`
- Product detail: `/product/:id`
- Cart: `/cart`
- Payment: `/payment`
- My Orders: `/my-orders`
- Order detail: `/my-orders/:orderId`
- Return page: `/my-orders/:orderId/return`
- Replace page: `/my-orders/:orderId/replace`
- Tracking page: `/track-order/:orderId`
- Payment success page: `/payment-success`
- Payment failure page: `/payment-failure`

### Admin UI entry points

- Admin orders page: `/admin-orders`

### UI-STEP-01: Place prepaid order from UI

1. Login as a normal user.
2. Open `/collection`.
3. Open any approved product.
4. Add the product to cart.
5. Open `/cart`.
6. Click the checkout / proceed-to-payment action to open `/payment`.
7. Select or confirm the shipping address.
8. Select an online payment option on the payment page.
9. Click the place order / continue button.
10. Confirm that the app redirects to the PayU hosted page.

Expected UI result:

- User is redirected away from the site to PayU.
- After returning, the order should appear in `/my-orders`.

### UI-STEP-02: Complete successful prepaid payment

1. Follow `UI-STEP-01`.
2. On the PayU page, complete the payment successfully.
3. Wait for redirect to `/payment-success`.
4. Click `Track Your Order` or let the page auto-redirect to `/my-orders`.
5. Open the order card or order detail page.

Expected UI result:

- Success page is shown.
- Cart is cleared.
- Order appears in `/my-orders`.
- Order status should show as confirmed / booked.
- Payment should appear as paid / completed.

### UI-STEP-03: Simulate failed prepaid payment and retry

1. Follow `UI-STEP-01`.
2. On the PayU page, cancel the payment or use a failure path.
3. Confirm redirect to `/payment-failure`.
4. Click `Retry Payment` on the failure page.
5. If returned to `/payment`, continue again.
6. Also verify the same order in `/my-orders`.
7. Click `Pay Now` from the order card or order detail page.

Expected UI result:

- Failure page is shown with retry option.
- Order remains saved.
- Retry action is available from failure page and from My Orders.

### UI-STEP-04: Place COD order from UI

1. Login as a normal user.
2. Add an item to cart.
3. Open `/payment`.
4. Select `COD`.
5. Complete the order submission.
6. Open `/my-orders`.
7. Open the order detail page.

Expected UI result:

- Order is created immediately.
- It appears in `/my-orders` without PayU redirect.
- UI should show a confirmed / booked state.
- Track Order action should be visible while the order is active.

### UI-STEP-05: Verify My Orders filters and search

1. Open `/my-orders`.
2. Use the filter tabs: `All Orders`, `Processing`, `Shipped`, `Delivered`, `Returned`, `Replaced`.
3. Use the search box with part of an order number.
4. Use the search box with part of a product name.
5. Open at least one order from the filtered list.

Expected UI result:

- Filters reduce the visible cards correctly.
- Search works for order number and product name.
- Clicking a card opens `/my-orders/:orderId`.

### UI-STEP-06: Open order detail and tracking

1. Open `/my-orders`.
2. Click `View Details` on any order card.
3. Verify timeline, payment block, address block, items list, and status badges.
4. For an active paid order, click `Track Order`.
5. Verify `/track-order/:orderId` loads.

Expected UI result:

- Detail page loads without errors.
- Timeline reflects the current order status.
- Tracking page opens for active orders.

### UI-STEP-07: Cancel order from UI

1. Use a COD order or a paid order that is still in `PENDING` or `BOOKED`.
2. Open `/my-orders`.
3. Open the three-dot menu on the order card.
4. Click `Cancel Order`.
5. Select a reason and submit the cancel modal.
6. Refresh `/my-orders` if needed.
7. Open the order detail page.

Expected UI result:

- Cancel modal submits successfully.
- Order status becomes `Cancelled`.
- Cancel button disappears afterward.

### UI-STEP-08: Request return from UI

1. Use an order that already reached `DELIVERED`.
2. Open `/my-orders`.
3. Open the three-dot menu and click `Return Order`, or use the `Return` button from order detail.
4. Confirm navigation to `/my-orders/:orderId/return`.
5. Select a return reason.
6. If `OTHER` is chosen, enter custom reason.
7. Optionally add comments.
8. Click `CONFIRM RETURN`.
9. Return to the order detail page.

Expected UI result:

- Success toast is shown.
- Order now shows a return badge or return status.
- Re-opening the menu should show return already requested instead of allowing a second fresh request.

### UI-STEP-09: Request replacement from UI

1. Use an order that already reached `DELIVERED`.
2. Open `/my-orders`.
3. Open the three-dot menu and click `Replace Item`, or use the `Replace` button from order detail.
4. Confirm navigation to `/my-orders/:orderId/replace`.
5. Select a replacement reason.
6. If `OTHER` is chosen, enter custom reason.
7. Optionally add comments.
8. Click `CONFIRM REPLACEMENT`.
9. Return to the order detail page.

Expected UI result:

- Success toast is shown.
- Order now shows a replacement badge or replacement status.
- Re-opening the menu should show replacement already requested instead of allowing a second fresh request.

### UI-STEP-10: Verify refund status visibility in user UI

1. Use an order whose refund has already started or completed.
2. Open `/my-orders`.
3. Verify refund badge on the order card.
4. Open `/my-orders/:orderId`.
5. Verify refund status is visible in the detail page.
6. If the refund updates while page is open, observe whether status updates without manual refresh.

Expected UI result:

- Refund state is visible in card and detail view.
- SSE-based live updates should reflect status changes.

### UI-STEP-11: Admin updates core order status from UI

1. Login as admin.
2. Open `/admin-orders`.
3. Search for the target order.
4. Click the edit action on the order card.
5. In the edit panel, choose a `New Status`.
6. Optionally fill `Tracking ID`.
7. Optionally fill `Delivery Partner`.
8. Click `Save Changes`.
9. Refresh admin list and user `/my-orders`.

Expected UI result:

- Success message appears in admin UI.
- Updated order state is visible in admin list.
- User-side My Orders and order detail reflect the same status.

### UI-STEP-12: Admin move order through full lifecycle from UI

1. Open `/admin-orders`.
2. Find a valid active order.
3. Edit it and set `BOOKED -> DISPATCHED`.
4. Save.
5. Edit again and set `DISPATCHED -> SHIPPED`, adding tracking number.
6. Save.
7. Edit again and set `SHIPPED -> OUT_FOR_DELIVERY`.
8. Save.
9. Edit again and set `OUT_FOR_DELIVERY -> DELIVERED`.
10. Verify the final result from both admin and user UI.

Expected UI result:

- Each state change is visible in admin UI.
- User order detail timeline advances correctly.
- Tracking number remains visible once added.

### UI-STEP-13: Admin process refund from UI

1. Login as admin.
2. Open `/admin-orders`.
3. Find a prepaid order with return status `QC_PASSED` or `COMPLETED`.
4. Confirm the `Process Refund` or `Retry Refund` button is visible.
5. Click the refund action.
6. Complete the confirmation flow if prompted.
7. Refresh the admin list.
8. Open the same order in user `/my-orders`.

Expected UI result:

- Refund processing starts from admin UI.
- Refund badge/status appears or updates in admin and user views.
- If refund completes, related return or replacement status may also resolve in UI.

### UI-STEP-14: Admin filtering and search on orders page

1. Open `/admin-orders`.
2. Use search by order number.
3. Use search by product name.
4. Use status tabs: `Pending`, `Booked`, `Dispatched`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`, `Returns`, `Replacements`.
5. Use date range filters.
6. Open and edit one filtered order.

Expected UI result:

- Search, status tabs, and date filters work together.
- Filtered counts look correct.
- Pagination still works after filter changes.

## 13. UI Coverage Gaps

These backend flows do not appear to have dedicated frontend screens in the current UI:

- Customer-initiated refund request button is not exposed in current user order UI.
- Admin return approval / rejection / pickup scheduling / QC completion screens are not exposed as dedicated frontend pages.
- Admin replacement approval / rejection / pickup / dispatch / delivery / completion screens are not exposed as dedicated frontend pages.
- A dedicated UI for the `collect COD` endpoint is not visible; admin order editing can change statuses, but COD collection itself is not surfaced as a separate workflow.

For those cases, backend/API or direct admin tooling is still required unless the frontend is expanded.
