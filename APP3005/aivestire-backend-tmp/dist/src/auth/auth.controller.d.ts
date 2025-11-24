import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user_id: string;
        email: string;
        role: string;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        access_token: string;
        user: {
            user_id: string;
            email: string;
            role: string;
        };
    }>;
    refresh(dto: RefreshTokenDto, req: Request, res: Response): Promise<{
        access_token: string;
        user: {
            user_id: string;
            email: string;
            role: string;
        };
    }>;
    logout(user: {
        user_id: string;
    }, res: Response): Promise<{
        message: string;
    }>;
    getMe(user: {
        user_id: string;
        email: string;
        role: string;
    }): Promise<{
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
}
