import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private slugify;
    register(dto: RegisterDto): Promise<{
        user_id: string;
        email: string;
        role: string;
    }>;
    validateUser(email: string, password: string): Promise<{
        email: string;
        role: string;
        user_id: string;
        password_hash: string | null;
        phone: string | null;
        refresh_token_hash: string | null;
        is_creator: boolean;
        is_admin: boolean;
        status: string;
        created_at: Date;
        last_login: Date | null;
    } | null>;
    login(dto: LoginDto, res: Response): Promise<{
        access_token: string;
        user: {
            user_id: string;
            email: string;
            role: string;
        };
    }>;
    refresh(user_id: string, refresh_token: string, res: Response): Promise<{
        access_token: string;
        user: {
            user_id: string;
            email: string;
            role: string;
        };
    }>;
    logout(user_id: string, res: Response): Promise<{
        message: string;
    }>;
    getProfile(user_id: string): Promise<{
        user_id: string;
        email: string;
        role: string;
        store_name: string;
    } | {
        user_id: string;
        email: string;
        role: string;
        store_name?: undefined;
    }>;
    issueTokens(user_id: string, role: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    simpleCreatorLogin(email: string, res: Response): Promise<{
        access_token: string;
        user: {
            user_id: string;
            email: string;
            role: string;
        };
    }>;
}
