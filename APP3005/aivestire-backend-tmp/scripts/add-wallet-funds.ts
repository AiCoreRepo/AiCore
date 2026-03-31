import { PrismaClient, WalletTransactionSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address. Usage: npx ts-node scripts/add-wallet-funds.ts <email>');
    process.exit(1);
  }

  const amount = 500;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    // Find or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: user.user_id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: user.user_id,
          balance: amount,
        },
      });
      console.log(`Created new wallet for ${email} with ${amount} INR`);
    } else {
      wallet = await prisma.wallet.update({
        where: { user_id: user.user_id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
      console.log(`Added ${amount} INR to existing wallet. New balance: ${wallet.balance} INR`);
    }

    // Add transaction record
    await prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        amount: amount,
        type: 'CREDIT',
        source: WalletTransactionSource.ADMIN_CREDIT,
        status: 'SUCCESS',
        description: 'Admin added funds',
        reference_id: `ADMIN_CREDIT_${Date.now()}`,
      },
    });

    console.log(`Successfully added transaction record for ${email}`);
  } catch (error) {
    console.error('Error adding funds to wallet:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
