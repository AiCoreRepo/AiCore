import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
    try {
        console.log('📊 Database Status Check\n');
        console.log('='.repeat(50));

        // Check users by role
        const [totalUsers, creators, admins, buyers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'CREATOR' } }),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'BUYER' } }),
        ]);

        console.log('\n👥 Users:');
        console.log(`   Total: ${totalUsers}`);
        console.log(`   Creators: ${creators}`);
        console.log(`   Admins: ${admins}`);
        console.log(`   Buyers: ${buyers}`);

        // Check products by status
        const [totalProducts, pending, approved, rejected, draft] = await Promise.all([
            prisma.product.count({ where: { is_deleted: false } }),
            prisma.product.count({ where: { status: ProductStatus.PENDING, is_deleted: false } }),
            prisma.product.count({ where: { status: ProductStatus.APPROVED, is_deleted: false } }),
            prisma.product.count({ where: { status: ProductStatus.REJECTED, is_deleted: false } }),
            prisma.product.count({ where: { status: ProductStatus.DRAFT, is_deleted: false } }),
        ]);

        console.log('\n📦 Products:');
        console.log(`   Total: ${totalProducts}`);
        console.log(`   Draft: ${draft}`);
        console.log(`   Pending: ${pending}`);
        console.log(`   Approved: ${approved}`);
        console.log(`   Rejected: ${rejected}`);

        // Check approvals
        const totalApprovals = await prisma.productApproval.count();
        console.log('\n✅ Approvals:');
        console.log(`   Total: ${totalApprovals}`);

        // List admin users
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                user_id: true,
                email: true,
                created_at: true,
            },
        });

        if (adminUsers.length > 0) {
            console.log('\n👑 Admin Users:');
            adminUsers.forEach((admin, index) => {
                console.log(`   ${index + 1}. ${admin.email}`);
                console.log(`      ID: ${admin.user_id}`);
                console.log(`      Created: ${admin.created_at.toLocaleDateString()}`);
            });
        } else {
            console.log('\n⚠️  No admin users found!');
            console.log('   Run: npm run script:create-admin');
        }

        console.log('\n' + '='.repeat(50));

    } catch (error) {
        console.error('❌ Error checking database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
checkDatabaseStatus()
    .then(() => {
        console.log('\n✨ Check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Check failed:', error);
        process.exit(1);
    });
