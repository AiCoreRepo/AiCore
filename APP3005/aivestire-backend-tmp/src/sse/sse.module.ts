import { Module, Global } from '@nestjs/common';
import { SseService } from './sse.service';
import { SseController } from './sse.controller';

/**
 * SSE Module — marked @Global so any module (RefundModule, etc.)
 * can inject SseService without explicitly importing SseModule.
 */
@Global()
@Module({
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
