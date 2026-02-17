import { IsEnum, IsUUID, IsArray, ArrayMinSize, ValidateNested, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
    @IsUUID()
    productId: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsUUID()
    shippingAddressId: string;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;
}
