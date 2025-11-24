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
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ user_id: string; email: string; role: string }> {
    return this.authService.register(dto);
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
  @Roles('admin', 'creator', 'buyer')
  @Get('me')
  async getMe(
    @CurrentUser() user: { user_id: string; email: string; role: string },
  ) {
    return this.authService.getProfile(user.user_id);
  }
}
