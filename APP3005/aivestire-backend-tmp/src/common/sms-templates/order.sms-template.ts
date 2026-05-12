/**
 * Order SMS Templates
 *
 * Myntra / Flipkart-style rich order notifications.
 * Kept under 320 characters where possible (2 SMS segments on most carriers).
 */

export interface OrderSmsItemPayload {
  productName: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface OrderBaseSmsPayload {
  /** Recipient phone number (E.164 format, e.g. +919876543210) */
  to: string;
  buyerName: string;
  buyerPhone?: string;
  orderId: string;
  orderNumber: string;
  items: OrderSmsItemPayload[];
  /** Total amount in INR (rupees, not paise) */
  totalAmount: number;
  paymentMethod: string;
  shippingCity: string;
  shippingState: string;
}

export interface OrderConfirmationSmsPayload extends OrderBaseSmsPayload {
  ordersUrl?: string;
}

export interface AdminOrderSmsPayload extends OrderBaseSmsPayload {
  adminUrl?: string;
}

/**
 * Build the customer order-confirmation SMS body.
 */
export function buildOrderConfirmationSms(
  payload: OrderConfirmationSmsPayload,
): string {
  const {
    buyerName,
    orderNumber,
    ordersUrl,
    items,
    totalAmount,
    paymentMethod,
    shippingCity,
    shippingState,
  } = payload;

  const firstName = buyerName.split(' ')[0] || buyerName;
  const previewItems = items
    .slice(0, 2)
    .map((item) => `${item.productName} x${item.quantity}`)
    .join(', ');
  const extraItems =
    items.length > 2 ? ` +${items.length - 2} more item(s)` : '';
  const formattedAmount = new Intl.NumberFormat('en-IN').format(totalAmount);
  const paymentLabel = formatPaymentMethod(paymentMethod);
  const location =
    [shippingCity, shippingState].filter(Boolean).join(', ') || 'your address';

  const lines = [
    `AiVestire Order Confirmed`,
    `Hi ${firstName}, your order #${orderNumber} is booked.`,
    previewItems ? `Items: ${previewItems}${extraItems}` : null,
    `Amount: Rs.${formattedAmount} via ${paymentLabel}`,
    `Ship to: ${location}`,
    ordersUrl ? `Track: ${ordersUrl}` : `We will notify you when it ships.`,
  ].filter((line): line is string => Boolean(line));

  return lines.join('\n');
}

/**
 * Build the admin order-alert SMS body.
 *
 * Example output:
 * Orders Alert
 * Order: #AV-000123
 * Buyer: Raj
 * Phone: +919876543210
 *
 * Items:
 * - Floral Kurta x2 (Size: M, Color: Blue)
 * - Linen Palazzo x1
 *
 * Amount: Rs.1,499 (Cash on Delivery)
 * City: Mumbai, Maharashtra
 *
 * Admin Login -> https://aivestire.com/admin-login
 */
export function buildAdminOrderAlertSms(payload: AdminOrderSmsPayload): string {
  const {
    buyerName,
    buyerPhone,
    orderNumber,
    adminUrl,
    items,
    totalAmount,
    paymentMethod,
    shippingCity,
    shippingState,
  } = payload;

  const firstName = buyerName.split(' ')[0] || buyerName;
  const previewItems = items.slice(0, 2);
  const itemLines = previewItems
    .map((item) => {
      const variants: string[] = [];
      if (item.size) variants.push(`Size: ${item.size}`);
      if (item.color) variants.push(`Color: ${item.color}`);
      const variantStr = variants.length > 0 ? ` (${variants.join(', ')})` : '';
      return `- ${item.productName} x${item.quantity}${variantStr}`;
    })
    .join('\n');
  const extraItemsLine = items.length > previewItems.length
    ? `+ ${items.length - previewItems.length} more item(s)`
    : null;

  const formattedAmount = new Intl.NumberFormat('en-IN').format(totalAmount);
  const paymentLabel = formatPaymentMethod(paymentMethod);
  const location = [shippingCity, shippingState].filter(Boolean).join(', ') || 'N/A';

  const lines = [
    `Orders Alert`,
    `Order: #${orderNumber}`,
    `Buyer: ${firstName}`,
    buyerPhone ? `Phone: ${buyerPhone}` : null,
    ``,
    `Items:`,
    itemLines,
    extraItemsLine,
    ``,
    `Amount: Rs.${formattedAmount} (${paymentLabel})`,
    `City: ${location}`,
    ``,
    adminUrl ? `Admin Login -> ${adminUrl}` : `Open Admin Panel in AiVestire`,
  ].filter((line): line is string => Boolean(line));

  return lines.join('\n');
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    COD: 'Cash on Delivery',
    ONLINE: 'Online Payment',
    PAYU: 'Online Payment',
    PREPAID: 'Prepaid',
    WALLET: 'Wallet',
    UPI: 'UPI',
    CARD: 'Card',
  };
  return map[method?.toUpperCase()] ?? method;
}
