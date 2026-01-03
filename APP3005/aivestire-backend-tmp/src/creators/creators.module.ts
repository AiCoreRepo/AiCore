import { Module } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatorsController } from './creators.controller';

@Module({
  imports: [PrismaModule],
  providers: [CreatorsService],
  controllers: [CreatorsController],
  exports: [CreatorsService],
})
export class CreatorsModule {}
