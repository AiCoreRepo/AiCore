import { PrismaService } from '../prisma/prisma.service';
export declare class ApprovalsService {
    private prisma;
    constructor(prisma: PrismaService);
    approve(productId: string, adminUserId: string, comment?: string): Promise<{
        message: string;
    }>;
    reject(productId: string, adminUserId: string, comment?: string): Promise<{
        message: string;
    }>;
}
