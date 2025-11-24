import { CreatorsService } from './creators.service';
export declare class CreatorsController {
    private readonly creatorsService;
    constructor(creatorsService: CreatorsService);
    verify(creatorId: string, admin: {
        user_id: string;
    }, verification_data?: any): Promise<{
        store_name: string;
        store_slug: string;
        about: string | null;
        user_id: string;
        created_at: Date;
        creator_id: string;
        verified: boolean;
        verification_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
