import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { BirthdayCouponsService } from './birthday-coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBirthdayDto } from './dto/update-birthday.dto';
import type { Request } from 'express';

@Controller('special-coupons')
@UseGuards(JwtAuthGuard)
export class BirthdayCouponsController {
    constructor(private readonly service: BirthdayCouponsService) { }

    @Get()
    async getSpecialCoupons(@Req() req: Request) {
        const user = req.user as any;
        const userId = user.user_id;
        return this.service.getSpecialCoupons(userId);
    }

    @Patch('birthday')
    async updateBirthday(@Req() req: Request, @Body() dto: UpdateBirthdayDto) {
        const user = req.user as any;
        const userId = user.user_id;
        return this.service.updateBirthday(userId, dto.dateOfBirth);
    }
}
