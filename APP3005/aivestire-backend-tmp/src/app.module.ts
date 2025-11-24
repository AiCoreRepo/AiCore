import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CreatorDashboardModule } from './creator-dashboard/creator-dashboard.module';

@Module({
  imports: [AuthModule, CreatorDashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
