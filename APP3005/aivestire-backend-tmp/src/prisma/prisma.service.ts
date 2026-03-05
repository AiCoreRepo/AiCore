import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    const maxAttempts = Number(process.env.PRISMA_CONNECT_RETRIES || 30);
    const delayMs = Number(process.env.PRISMA_CONNECT_RETRY_DELAY_MS || 2000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt >= maxAttempts) {
          console.error(
            `[Prisma] Unable to connect after ${maxAttempts} attempts; ` +
              `last error: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }

        console.warn(
          `[Prisma] Connection attempt ${attempt}/${maxAttempts} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}
