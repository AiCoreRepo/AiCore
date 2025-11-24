import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    approve(productId: string, admin: {
        user_id: string;
    }, comment?: string): Promise<{
        message: string;
    }>;
    reject(productId: string, admin: {
        user_id: string;
    }, comment?: string): Promise<{
        message: string;
    }>;
}
