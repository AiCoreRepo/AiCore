import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty()
  cart_item_id: string;

  @ApiProperty()
  product_id: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  size?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiProperty()
  price_cents_snapshot: number;

  @ApiProperty()
  currency_snapshot: string;

  @ApiProperty()
  added_at: Date;

  @ApiProperty()
  product: {
    product_id: string;
    title: string;
    slug: string;
    price_cents: number;
    currency: string;
    inventory_count: number;
    category: string | null;
    creator: {
      creator_id: string;
      store_name: string;
      store_slug: string;
    };
    images: Array<{
      image_id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

export class CartSummaryDto {
  @ApiProperty()
  item_count: number;

  @ApiProperty()
  subtotal_cents: number;

  @ApiProperty()
  tax_cents: number;

  @ApiProperty()
  shipping_cents: number;

  @ApiProperty()
  discount_cents: number;

  @ApiProperty()
  total_cents: number;

  @ApiProperty()
  currency: string;
}

export class CartResponseDto {
  @ApiProperty()
  cart_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  applied_coupon_code?: string | null;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ type: CartSummaryDto })
  summary: CartSummaryDto;
}
