import { IsEnum, IsString, IsOptional, ValidateIf } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ReviewProductDto {
  @IsEnum(ApprovalStatus, {
    message: 'Action must be either APPROVED or REJECTED',
  })
  action: ApprovalStatus;

  @ValidateIf((o) => o.action === 'REJECTED')
  @IsString()
  @IsOptional()
  comment?: string;

  // Custom validation to ensure comment is required for rejection
  validate() {
    if (this.action === 'REJECTED' && !this.comment) {
      throw new Error('Comment is required when rejecting a product');
    }
  }
}
