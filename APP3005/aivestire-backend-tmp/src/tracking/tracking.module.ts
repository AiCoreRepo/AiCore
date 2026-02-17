import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [TrackingService],
    exports: [TrackingService],
})
export class TrackingModule { }
