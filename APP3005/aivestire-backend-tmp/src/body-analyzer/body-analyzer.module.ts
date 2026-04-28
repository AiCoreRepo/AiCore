import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BodyAnalyzerController } from './body-analyzer.controller';
import { BodyAnalyzerService } from './body-analyzer.service';

@Module({
  imports: [ConfigModule],
  controllers: [BodyAnalyzerController],
  providers: [BodyAnalyzerService],
  exports: [BodyAnalyzerService],
})
export class BodyAnalyzerModule {}
