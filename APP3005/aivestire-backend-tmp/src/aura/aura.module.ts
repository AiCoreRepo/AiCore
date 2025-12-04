import { Module } from '@nestjs/common';
import { AuraController } from './aura.controller';
import { AuraService } from './aura.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';

@Module({
    imports: [PrismaModule],
    controllers: [AuraController],
    providers: [AuraService, CloudinaryService],
    exports: [AuraService],
})
export class AuraModule { }

