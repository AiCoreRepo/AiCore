import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
        console.error('Usage: npx ts-node credit-wallet.ts <user-email> <amount>');
        console.error('Example: npx ts-node credit-wallet.ts user@example.com 500');
        process.exit(1);
    }

    const email = args[0];
    const amount = parseFloat(args[1]);

    if (isNaN(amount) || amount <= 0) {
        console.error('Error: Amount must be a positive number.');
        process.exit(1);
    }

    try {
        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { wallet: true }
        });

        if (!user) {
            console.error(`Error: User with email '${email}' not found.`);
            process.exit(1);
        }

        let wallet = user.wallet;

        // 2. Create wallet if it doesn't exist (users should have one created automatically, but just in case)
        if (!wallet) {
            console.log(`Wallet not found for user '${email}'. Creating one...`);
            wallet = await prisma.wallet.create({
                data: {
                    user_id: user.user_id,
                    balance: 0,
                }
            });
        }

        // 3. Add balance and transaction atomically
        const newBalance = Number(wallet.balance) + amount;

        await prisma.$transaction([
            prisma.wallet.update({
                where: { wallet_id: wallet.wallet_id },
                data: { balance: newBalance }
            }),
            prisma.walletTransaction.create({
                data: {
                    wallet_id: wallet.wallet_id,
                    type: 'CREDIT',
                    source: 'ADMIN_CREDIT', // Good for testing
                    amount: amount,
                    description: 'Test balance added via script',
                    status: 'SUCCESS' // Depending on your Prisma schema, might not be required if there's a default
                }
            })
        ]);

        console.log('✅ Successfully credited wallet!');
        console.log(`User: ${email}`);
        console.log(`Added Amount: ₹${amount.toFixed(2)}`);
        console.log(`New Balance: ₹${newBalance.toFixed(2)}`);

    } catch (error) {
        console.error('❌ Failed to add wallet balance:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
