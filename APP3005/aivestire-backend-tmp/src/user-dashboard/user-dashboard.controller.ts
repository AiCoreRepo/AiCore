import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-dashboard')
@UseGuards(JwtAuthGuard)
export class UserDashboardController {
    constructor(private readonly dashboardService: UserDashboardService) { }

    @Get('stats')
    async getStats(@Request() req: any) {
        const userId = req.user.user_id;
        return this.dashboardService.getStats(userId);
    }
}
