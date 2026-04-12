import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';
import { AdminClothUploadService } from './cloth-upload.service';
import { ClothCleanupService } from './cloth-cleanup.service';
import { CleanupAdminClothUploadDto } from './dto/cleanup-admin-cloth-upload.dto';
import { SyncAdminClothFolderDto } from './dto/sync-admin-cloth-folder.dto';

@Controller('admin-cloth-upload')
@UseGuards(AdminJwtGuard)
export class AdminClothUploadController {
  constructor(
    private readonly adminClothUploadService: AdminClothUploadService,
    private readonly clothCleanupService: ClothCleanupService,
  ) { }

  @Post('sync-folder')
  async syncFolder(@Body() dto: SyncAdminClothFolderDto) {
    return this.adminClothUploadService.syncFromFolder(dto);
  }

  @Post('cleanup')
  async cleanup(@Body() dto: CleanupAdminClothUploadDto) {
    return this.clothCleanupService.cleanup(dto);
  }
}
