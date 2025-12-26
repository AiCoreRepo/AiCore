import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                    password: configService.get('REDIS_PASSWORD') || undefined,
                    tls: configService.get('REDIS_HOST', 'localhost').includes('upstash.io')
                        ? {}
                        : undefined,
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                },
                defaultJobOptions: {
                    removeOnComplete: 100, // Keep last 100 completed jobs
                    removeOnFail: 200,     // Keep last 200 failed jobs
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    exports: [BullModule],
})
export class QueueModule { }
