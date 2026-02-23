const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdmin() {
    const email = 'admin@aivestire.com';
    const password = 'Admin@123456';

    try {
        const hash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password_hash: hash, role: 'ADMIN' }
        });
        console.log('Admin password reset successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
