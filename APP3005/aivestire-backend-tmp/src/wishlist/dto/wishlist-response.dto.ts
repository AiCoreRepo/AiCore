import { ApiProperty } from '@nestjs/swagger';

export class WishlistItemResponseDto {
  @ApiProperty()
  wishlist_item_id: string;

  @ApiProperty()
  product_id: string;

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
      verified: boolean;
    };
    images: Array<{
      image_id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

export class WishlistSummaryDto {
  @ApiProperty()
  item_count: number;

  @ApiProperty()
  total_value_cents: number;

  @ApiProperty()
  currency: string;
}

export class WishlistResponseDto {
  @ApiProperty()
  wishlist_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [WishlistItemResponseDto] })
  items: WishlistItemResponseDto[];

  @ApiProperty({ type: WishlistSummaryDto })
  summary: WishlistSummaryDto;
}

export class WishlistCheckResponseDto {
  @ApiProperty()
  is_in_wishlist: boolean;

  @ApiProperty({ required: false })
  wishlist_item_id?: string;
}
