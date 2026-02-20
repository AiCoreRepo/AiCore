import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CreatorsModule } from './creators/creators.module';
import { ProductsModule } from './products/products.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CreatorDashboardModule } from './creator-dashboard/creator-dashboard.module';
import { AuraModule } from './aura/aura.module';
import { AdminModule } from './admin/admin.module';
import { AiTryOnModule } from './ai-tryon/ai-tryon.module';
import { AdminSeederService } from './common/admin-seeder.service';
import { RecommendationModule } from './recommendation/recommendation.module';
import { DifferentAnglesGenModule } from './DifferentAnglesGen/different-angles-gen.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrderModule } from './order/order.module';
import { RefundModule } from './refund/refund.module';
import { ReturnModule } from './return/return.module';
import { ReplacementModule } from './replace/replace.module';
import { PaymentModule } from './payment/payment.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    QueueModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CreatorsModule,
    ProductsModule,
    ApprovalsModule,
    CreatorDashboardModule,
    AuraModule,
    AdminModule,
    AiTryOnModule,
    RecommendationModule,
    DifferentAnglesGenModule,
    CartModule,
    AddressModule,
    WishlistModule,
    OrderModule,
    RefundModule,
    ReturnModule,
    ReplacementModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService, AdminSeederService],
})
export class AppModule { }

