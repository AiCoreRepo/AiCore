import { Module, forwardRef } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';

@Module({
    imports: [PrismaModule, forwardRef(() => CartModule)],
    controllers: [WishlistController],
    providers: [WishlistService],
    exports: [WishlistService],
})
export class WishlistModule { }
