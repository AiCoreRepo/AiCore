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
import { RecommendationModule } from './recommendation/recommendation.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
