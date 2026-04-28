// ============================================
// WALLET CONTROLLER
// ============================================

import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { AdminCreditDto } from './dto/admin-credit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    // GET /wallet — get wallet balance
    @Get()
    async getBalance(@Req() req: { user: { user_id: string } }) {
        return this.walletService.getBalance(req.user.user_id);
    }

    // GET /wallet/transactions — paginated transaction history
    @Get('transactions')
    async getTransactions(
        @Req() req: { user: { user_id: string } },
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit || '10', 10) || 10));
        return this.walletService.getTransactions(
            req.user.user_id,
            pageNum,
            limitNum,
        );
    }

    // POST /wallet/credit — credit wallet (internal services)
    @Post('credit')
    async creditWallet(
        @Req() req: { user: { user_id: string } },
        @Body() dto: CreditWalletDto,
    ) {
        return this.walletService.creditWallet(req.user.user_id, dto);
    }

    // POST /wallet/debit — debit wallet (checkout)
    @Post('debit')
    async debitWallet(
        @Req() req: { user: { user_id: string } },
        @Body() dto: DebitWalletDto,
    ) {
        return this.walletService.debitWallet(req.user.user_id, dto);
    }

    // POST /wallet/admin-credit — admin credits wallet (ADMIN only)
    @Post('admin-credit')
    @Roles('ADMIN')
    async adminCreditWallet(@Body() dto: AdminCreditDto) {
        return this.walletService.adminCreditWallet(dto);
    }
}
