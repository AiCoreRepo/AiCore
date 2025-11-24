export declare class CreateProductDto {
    title: string;
    creator_id: string;
    description?: string;
    price_cents: number;
    currency?: string;
    slug?: string;
    inventory_count?: number;
    images?: string[];
}
