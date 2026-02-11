const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdmin() {
    const email = 'admin@aivestire.com';
    const password = 'Admin@123456';

    try {
        // Check if admin exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            if (existingUser.role === 'ADMIN') {
                console.log('✅ Admin already exists:', email);
            } else {
                await prisma.user.update({
                    where: { email },
                    data: { role: 'ADMIN' }
                });
                console.log('✅ User upgraded to ADMIN:', email);
            }
        } else {
            // Create admin
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = await prisma.user.create({
                data: {
                    email,
                    password_hash: hashedPassword,
                    role: 'ADMIN',
                    status: 'active'
                }
            });
            console.log('✅ Admin created successfully!');
            console.log('   📧 Email:', email);
            console.log('   🔑 Password:', password);
            console.log('   🆔 User ID:', admin.user_id);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
