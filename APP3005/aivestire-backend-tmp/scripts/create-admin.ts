import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        console.log('🔧 Creating admin user...\n');

        // Admin user details
        const adminEmail = 'admin@aivestire.com';
        const adminPassword = 'Admin@123456'; // Change this to a secure password
        const saltRounds = 10;

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email:', adminEmail);

            // Update role to ADMIN if not already
            if (existingAdmin.role !== UserRole.ADMIN) {
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { role: UserRole.ADMIN },
                });
                console.log('✅ Updated existing user to ADMIN role');
            } else {
                console.log('✅ User already has ADMIN role');
            }

            console.log('\n📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                password_hash: hashedPassword,
                role: UserRole.ADMIN,
                status: 'active',
            },
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('👤 User ID:', adminUser.user_id);
        console.log('🎭 Role:', adminUser.role);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        console.log('💡 Use this email and password to login via POST /auth/login');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createAdminUser()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
