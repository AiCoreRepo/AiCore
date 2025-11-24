import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
export declare class CreatorsService {
    private prisma;
    constructor(prisma: PrismaService);
    verifyCreator(creator_id: string, admin_user_id: string, verification_data?: unknown): Promise<{
        store_name: string;
        store_slug: string;
        about: string | null;
        user_id: string;
        created_at: Date;
        creator_id: string;
        verified: boolean;
        verification_data: Prisma.JsonValue | null;
    }>;
}
