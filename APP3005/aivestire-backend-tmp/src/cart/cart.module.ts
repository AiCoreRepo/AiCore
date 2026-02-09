import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { GuestCartService } from './guest-cart.service';
import { CartMergeService } from './cart-merge.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GuestSessionMiddleware } from '../common/middleware/guest-session.middleware';

@Module({
    imports: [PrismaModule],
    controllers: [CartController],
    providers: [CartService, GuestCartService, CartMergeService],
    exports: [CartService, GuestCartService, CartMergeService],
})
export class CartModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply guest session middleware to all cart routes
        consumer
            .apply(GuestSessionMiddleware)
            .forRoutes(CartController);
    }
}
