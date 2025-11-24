export declare class TagDto {
    name: string;
}
export declare class CreateProductDto {
    title: string;
    description?: string;
    price_cents: number;
    currency?: string;
    inventory_count?: number;
    images?: string[];
    tags?: TagDto[];
}
