import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from '../services/email.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Email')
@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('test-send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send a test email (Admin only)' })
    @ApiResponse({ status: 202, description: 'Email has been queued for sending.' })
    @HttpCode(HttpStatus.ACCEPTED)
    async sendTestEmail(@Body() sendEmailDto: SendEmailDto) {
        await this.emailService.queueEmail(sendEmailDto);
        return { message: 'Email queued successfully' };
    }
}
