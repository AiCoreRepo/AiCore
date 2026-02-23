import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TryOnPermissionStatus } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ user_id: string; email: string; role: string }> {
    return this.authService.register(dto);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(
    @Body() dto: CheckEmailDto,
  ): Promise<{ available: boolean }> {
    return this.authService.checkEmailAvailability(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    user: { user_id: string; email: string; role: string };
  }> {
    return this.authService.login(dto, res);
  }

  // Simple creator login endpoint
  @Post('creator-login')
  @HttpCode(HttpStatus.OK)
  async creatorLogin(
    @Body('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    user: { user_id: string; email: string; role: string };
  }> {
    // No password, approval, or verification required
    return this.authService.simpleCreatorLogin(email, res);
  }

  // Google OAuth endpoint
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    user: { user_id: string; email: string; role: string };
  }> {
    return this.authService.googleAuth(dto, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    user: { user_id: string; email: string; role: string };
  }> {
    const cookieHeader = req.headers['cookie'];
    const tokenFromCookie: string | undefined =
      typeof cookieHeader === 'string'
        ? (() => {
          const parts = cookieHeader.split(';');
          for (const p of parts) {
            const idx = p.indexOf('=');
            if (idx === -1) continue;
            const key = decodeURIComponent(p.slice(0, idx).trim());
            if (key === 'refresh_token') {
              const val = p.slice(idx + 1).trim();
              return decodeURIComponent(val);
            }
          }
          return undefined;
        })()
        : undefined;
    return this.authService.refresh(
      dto.user_id,
      dto.refresh_token ?? tokenFromCookie ?? '',
      res,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { user_id: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    return this.authService.logout(user.user_id, res);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR', 'BUYER')
  @Get('me')
  async getMe(
    @CurrentUser() user: { user_id: string; email: string; role: string },
  ) {
    return this.authService.getProfile(user.user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('try-on-permission/request')
  async requestTryOn(@CurrentUser('user_id') userId: string) {
    return this.authService.requestTryOnPermission(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/try-on-permissions/pending')
  async getPendingTryOnRequests() {
    return this.authService.getPendingTryOnPermissions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/try-on-permissions/approved')
  async getApprovedTryOnRequests() {
    return this.authService.getApprovedTryOnPermissions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/try-on-permissions/resolve/:userId')
  async resolveTryOnRequest(
    @Param('userId') userId: string,
    @Body('status') status: TryOnPermissionStatus,
  ) {
    return this.authService.updateTryOnPermission(userId, status);
  }

  // OTP Endpoints
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phoneNumber);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phoneNumber, dto.otp);
  }

  @Post('otp/resend')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phoneNumber);
  }
}
