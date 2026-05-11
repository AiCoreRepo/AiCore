/**
 * Creator Upload SMS Templates
 *
 * Sent to the creator after they successfully upload a new product
 * (via POST /products/hierarchy).
 */

export interface CreatorUploadSmsPayload {
  /** Creator's phone number (E.164 format, e.g. +919876543210) */
  to: string;
  creatorName: string;
  productTitle: string;
  productId: string;
  dashboardUrl?: string;
  priceInRupees: number;
  patternCount: number;
  totalColorVariants: number;
  totalStock: number;
  category?: string;
  uploadedAt: Date;
  /** DRAFT → pending admin review; APPROVED → live immediately */
  status: 'DRAFT' | 'APPROVED' | 'PENDING';
}

/**
 * Build the creator upload confirmation SMS body.
 *
 * Example output:
 * 🎉 Upload Successful! Hi Priya,
 *
 * Your product is live for review:
 * 👗 Floral Anarkali Suit
 * 💰 Price: ₹2,199
 * 🎨 2 Pattern(s) | 4 Color Variant(s) | Stock: 40
 * 📂 Category: Ethnic Wear
 *
 * ⏳ Status: Pending admin approval
 * 📅 Uploaded: 30 Apr 2026, 12:05 AM
 *
 * Your item will go live once approved.
 * - Team Aivestire
 */
export function buildCreatorUploadSms(payload: CreatorUploadSmsPayload): string {
  const {
    creatorName,
    productTitle,
    dashboardUrl,
    priceInRupees,
    patternCount,
    totalColorVariants,
    totalStock,
    category,
    uploadedAt,
    status,
  } = payload;

  const firstName = creatorName.split(' ')[0] || creatorName;
  const formattedPrice = new Intl.NumberFormat('en-IN').format(priceInRupees);
  const formattedDate = new Date(uploadedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLine = resolveStatusLine(status);
  const categoryLine = category ? `Category: ${category}` : null;

  const lines = [
    `Creator Cloth Upload Alert`,
    `Creator: ${firstName}`,
    ``,
    `Product: ${productTitle}`,
    `Price: Rs.${formattedPrice}`,
    `Variants: ${patternCount} Patterns | ${totalColorVariants} Colors`,
    `Stock: ${totalStock}`,
    categoryLine,
    ``,
    statusLine,
    `Time: ${formattedDate}`,
    ``,
    dashboardUrl
      ? `Dashboard -> ${dashboardUrl}`
      : `Open the relevant dashboard in AiVestire`
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

function resolveStatusLine(status: CreatorUploadSmsPayload['status']): string {
  switch (status) {
    case 'APPROVED':
      return `Status: Approved & Live`;
    case 'PENDING':
    case 'DRAFT':
    default:
      return `Status: Pending admin approval`;
  }
}
