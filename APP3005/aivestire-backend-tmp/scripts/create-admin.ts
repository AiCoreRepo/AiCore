import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    console.log('\n👑 Creating Admin Account\n');
    console.log('='.repeat(60));

    try {
        const adminEmail = 'admin@aivestire.com';
        const adminPassword = 'admin123'; // Simple password for testing

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingAdmin) {
            console.log('⚠️  Admin account already exists.');
            console.log(`   Email: ${adminEmail}`);
            // Update password just in case
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password_hash: hashedPassword,
                    role: 'ADMIN', // Ensure role is ADMIN
                },
            });
            console.log('   ✅ Password and role updated.');
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password_hash: hashedPassword,
                    role: 'ADMIN',
                    status: 'active',
                },
            });
            console.log('✅ Created new admin account.');
        }

        console.log('\n📝 ADMIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('='.repeat(60));
        console.log('');

    } catch (error) {
        console.error('❌ Failed to create admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
