import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from '../queues/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuraModule } from '../aura/aura.module';
import { AiTryOnModule } from '../ai-tryon/ai-tryon.module';
import { DifferentAnglesGenModule } from '../angles-generation/different-angles-gen.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AuraProcessor } from './aura.processor';
import { TryOnProcessor } from './tryon.processor';
import { AnglesGenerationProcessor } from './angles-generation.processor';

/**
 * WorkerModule
 * -------------------------------------------------
 * Loaded ONLY by the worker process (worker/main.ts).
 * Imports all modules whose services the processors need,
 * and registers both Bull processor classes.
 *
 * NOT imported by AppModule — keeps API and Worker concerns separate.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    QueueModule,
    PrismaModule,
    ProductsModule,
    UsersModule,
    AuraModule,
    AiTryOnModule,
    DifferentAnglesGenModule,
  ],
  providers: [
    // All Bull processor classes live here — registered once per worker process
    TryOnProcessor,
    AuraProcessor,
    AnglesGenerationProcessor,
  ],
})
export class WorkerModule { }
