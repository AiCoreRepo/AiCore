import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
    Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuraService } from './aura.service';
import { CreateAuraDto } from './dto/create-aura.dto';

@Controller('aura')
@UseGuards(JwtAuthGuard)
export class AuraController {
    constructor(private readonly auraService: AuraService) { }

    @Post()
    @UseInterceptors(FileInterceptor('photo'))
    async createAura(
        @CurrentUser('user_id') userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() createAuraDto: CreateAuraDto,
    ) {
        // Validate file upload
        if (!file) {
            throw new BadRequestException('Photo is required');
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must be less than 10MB');
        }

        return this.auraService.createAura(userId, file, createAuraDto);
    }

    @Get('status')
    async getAuraStatus(@CurrentUser('user_id') userId: string) {
        return this.auraService.hasAura(userId);
    }

    @Get()
    async getMyAura(@CurrentUser('user_id') userId: string) {
        return this.auraService.getAuraByUserId(userId);
    }
}

