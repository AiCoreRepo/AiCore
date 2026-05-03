/**
 * Order SMS Templates
 *
 * Myntra / Flipkart-style rich order notifications.
 * Kept under 320 characters where possible (2 SMS segments on most carriers).
 */

export interface OrderSmsPayload {
  /** Buyer's phone number (E.164 format, e.g. +919876543210) */
  to: string;
  buyerName: string;
  orderId: string;
  orderNumber: string;
  orderUrl?: string;
  items: Array<{
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  /** Total amount in INR (rupees, not paise) */
  totalAmount: number;
  paymentMethod: string;
  estimatedDelivery: Date;
  shippingCity: string;
  shippingState: string;
}

/**
 * Build the order-confirmation SMS body.
 *
 * Example output:
 * ✅ Order Confirmed! Hi Raj,
 * Order #AV-000123 placed successfully.
 *
 * 📦 Items:
 * • Floral Kurta x2 (Size: M, Color: Blue)
 * • Linen Palazzo x1
 *
 * 💰 Total: ₹1,499 | Payment: COD
 * 🚚 Est. Delivery: 06 May 2026
 * 📍 Delivering to: Mumbai, Maharashtra
 *
 * Track your order in the Aivestire app.
 * - Team Aivestire
 */
export function buildOrderConfirmationSms(payload: OrderSmsPayload): string {
  const {
    buyerName,
    orderNumber,
    orderUrl,
    items,
    totalAmount,
    paymentMethod,
    estimatedDelivery,
    shippingCity,
    shippingState,
  } = payload;

  const firstName = buyerName.split(' ')[0] || buyerName;

  const itemLines = items
    .map((item) => {
      const variants: string[] = [];
      if (item.size) variants.push(`Size: ${item.size}`);
      if (item.color) variants.push(`Color: ${item.color}`);
      const variantStr = variants.length > 0 ? ` (${variants.join(', ')})` : '';
      return `- ${item.productName} x${item.quantity}${variantStr}`;
    })
    .join('\n');

  const formattedAmount = new Intl.NumberFormat('en-IN').format(totalAmount);
  const formattedDate = new Date(estimatedDelivery).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const paymentLabel = formatPaymentMethod(paymentMethod);

  return [
    `Orders Alert`,
    `Order: #${orderNumber}`,
    `Buyer: ${firstName}`,
    ``,
    `Items:`,
    itemLines,
    ``,
    `Amount: Rs.${formattedAmount} (${paymentLabel})`,
    `City: ${shippingCity}, ${shippingState}`,
    `Delivery: ${formattedDate}`,
    ``,
    orderUrl ? `Track Order -> ${orderUrl}` : `Track your order in AiVestire`
  ].join('\n');
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    COD: 'Cash on Delivery',
    ONLINE: 'Online Payment',
    WALLET: 'Wallet',
    UPI: 'UPI',
    CARD: 'Card',
  };
  return map[method?.toUpperCase()] ?? method;
}
