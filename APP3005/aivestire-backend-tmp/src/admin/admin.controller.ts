import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ReviewProductDto } from './dto/review-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    /**
     * GET /admin/stats
     * Get dashboard statistics
     */
    @Get('stats')
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    /**
     * GET /admin/products/pending
     * Get all products pending approval
     */
    @Get('products/pending')
    async getPendingProducts() {
        return this.adminService.getPendingProducts();
    }

    /**
     * PATCH /admin/products/:id/review
     * Approve or reject a product
     */
    @Patch('products/:id/review')
    async reviewProduct(
        @Param('id') productId: string,
        @Body() dto: ReviewProductDto,
        @CurrentUser('user_id') adminUserId: string,
    ) {
        return this.adminService.reviewProduct(productId, dto, adminUserId);
    }
}
