import { Module } from '@nestjs/common';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [UserDashboardController],
    providers: [UserDashboardService],
})
export class UserDashboardModule { }
