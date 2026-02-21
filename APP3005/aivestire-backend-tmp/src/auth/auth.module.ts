import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
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
  ],
  providers: [AuthService, OtpService, TwilioService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
