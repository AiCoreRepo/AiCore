import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get('REDIS_URL');

                // Use REDIS_URL if available (production), otherwise use individual credentials (local)
                const redisConfig = redisUrl
                    ? redisUrl  // Upstash connection string
                    : {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                        password: configService.get('REDIS_PASSWORD') || undefined,
                    };

                console.log('🔧 Redis Configuration:', {
                    usingUrl: !!redisUrl,
                    host: redisUrl ? 'from URL' : configService.get('REDIS_HOST', 'localhost'),
                    port: redisUrl ? 'from URL' : configService.get('REDIS_PORT', 6379),
                });

                return {
                    redis: redisConfig,
                    defaultJobOptions: {
                        removeOnComplete: 100, // Keep last 100 completed jobs
                        removeOnFail: 200,     // Keep last 200 failed jobs
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 5000,
                        },
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    exports: [BullModule],
})
export class QueueModule { }
