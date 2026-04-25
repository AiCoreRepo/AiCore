import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { PasswordResetService } from './password-reset/password-reset.service';
import { PasswordResetRepository } from './password-reset/password-reset.repository';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { TwilioService } from '../common/twilio.service';
import { JWT_ACCESS_TOKEN_EXPIRES_IN } from '../common/constants';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: {
        expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
      },
    }),
    UsersModule,
    PrismaModule,
    EmailModule,
  ],
  providers: [
    AuthService,
    OtpService,
    PasswordResetService,
    PasswordResetRepository,
    TwilioService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
