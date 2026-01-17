import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setCreatorPassword() {
    console.log('\n🔐 Setting Creator Password\n');

    try {
        const email = 'creator@gmail.com';
        const password = 'creator123';

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ User ${email} not found. Run import script first.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email },
            data: { password_hash: hashedPassword },
        });

        console.log(`✅ Password set for ${email}`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('❌ Failed to set password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setCreatorPassword();
