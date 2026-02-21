import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');

        // Parse Redis URL for Upstash/production
        if (redisUrl) {
          console.log('🔧 Redis Configuration: Using REDIS_URL');

          try {
            const url = new URL(redisUrl);
            const isTLS = url.protocol === 'rediss:';

            console.log(`   Protocol: ${url.protocol}`);
            console.log(`   Host: ${url.hostname}`);
            console.log(`   Port: ${url.port || (isTLS ? 6379 : 6379)}`);
            console.log(`   TLS: ${isTLS ? 'enabled' : 'disabled'}`);

            return {
              redis: {
                host: url.hostname,
                port: parseInt(url.port) || 6379,
                password: url.password || undefined,
                username: url.username || undefined,
                tls: isTLS ? { rejectUnauthorized: false } : undefined,
                maxRetriesPerRequest: null, // Required for Bull
                enableReadyCheck: false, // Helps with Upstash
              },
              defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 200,
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 5000,
                },
              },
            };
          } catch (error) {
            console.error('❌ Failed to parse REDIS_URL:', error.message);
            throw error;
          }
        }

        // Local development fallback
        console.log('🔧 Redis Configuration: Using local Redis');
        return {
          redis: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: null,
          },
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 200,
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
export class QueueModule {}
