import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Admin Seeder Service
 * Automatically seeds an admin user on application startup if configured via environment variables.
 * 
 * Set these environment variables in production:
 *   SEED_ADMIN_EMAIL=admin@yourdomain.com
 *   SEED_ADMIN_PASSWORD=YourSecurePassword123
 * 
 * The admin will only be created if it doesn't already exist.
 * Remove these env vars after the admin is created for security.
 */
@Injectable()
export class AdminSeederService implements OnModuleInit {
    private readonly logger = new Logger(AdminSeederService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.seedAdminIfConfigured();
    }

    private async seedAdminIfConfigured(): Promise<void> {
        const adminEmail = this.configService.get<string>('SEED_ADMIN_EMAIL');
        const adminPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD');

        // Only proceed if both env vars are set
        if (!adminEmail || !adminPassword) {
            this.logger.debug('Admin seeding skipped: SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set');
            return;
        }

        this.logger.log(`🔧 Admin seeding triggered for: ${adminEmail}`);

        try {
            // Check if admin already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: adminEmail },
            });

            if (existingUser) {
                // User exists - ensure they have ADMIN role
                if (existingUser.role !== 'ADMIN') {
                    await this.prisma.user.update({
                        where: { email: adminEmail },
                        data: { role: 'ADMIN' },
                    });
                    this.logger.log(`✅ Existing user ${adminEmail} upgraded to ADMIN role`);
                } else {
                    this.logger.log(`✅ Admin user ${adminEmail} already exists`);
                }
                return;
            }

            // Create new admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = await this.prisma.user.create({
                data: {
                    email: adminEmail,
                    password_hash: hashedPassword,
                    role: 'ADMIN',
                    status: 'active',
                },
            });

            this.logger.log(`✅ Admin user created successfully!`);
            this.logger.log(`   📧 Email: ${adminEmail}`);
            this.logger.log(`   🆔 User ID: ${adminUser.user_id}`);
            this.logger.warn(`   ⚠️ IMPORTANT: Remove SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars after confirming login works!`);

        } catch (error) {
            this.logger.error(`❌ Failed to seed admin user: ${error.message}`);
        }
    }
}
