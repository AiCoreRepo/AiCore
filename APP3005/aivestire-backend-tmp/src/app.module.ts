import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './queues/queue.module';
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
import { DifferentAnglesGenModule } from './angles-generation/different-angles-gen.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrderModule } from './order/order.module';
import { RefundModule } from './refund/refund.module';
import { ReturnModule } from './return/return.module';
import { ReplacementModule } from './replace/replace.module';
import { PaymentModule } from './payment/payment.module';
import { EmailModule } from './email/email.module';
import { AdminAuthModule } from './auth/admin/admin-auth.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CouponsModule } from './coupons/coupons.module';
import { CouponScopeModule } from './coupon-scopes/coupon-scope.module';
import { CouponApplyModule } from './coupon-apply/coupon-apply.module';
import { BirthdayCouponsModule } from './birthday-coupons/birthday-coupons.module';
import { CreatorCouponsModule } from './creator-coupons/creator-coupons.module';
import { WalletModule } from './wallet/wallet.module';
import { ProductGroupsModule } from './product-groups/product-groups.module';
import { CategoriesModule } from './categories/categories.module';
import { AdminAnalyticsModule } from './admin-analytics/admin-analytics.module';
import { InventoryManagementModule } from './admin/inventory-management/inventory-management.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
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
    EmailModule,
    FeedbackModule,
    AdminAuthModule,
    UserDashboardModule,
    CouponsModule,
    CouponScopeModule,
    CouponApplyModule,
    BirthdayCouponsModule,
    CreatorCouponsModule,
    WalletModule,
    ProductGroupsModule,
    CategoriesModule,
    AdminAnalyticsModule,
    InventoryManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService, AdminSeederService],
})
export class AppModule {}
