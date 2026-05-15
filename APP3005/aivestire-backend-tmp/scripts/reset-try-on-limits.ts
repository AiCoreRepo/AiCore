import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_MAX_TRY_ONS = 3;
const TARGET_TRY_ONS_USED = 0;

async function resetTryOnLimits() {
  console.log('\nResetting virtual try-on usage for all users...\n');

  try {
    const result = await prisma.user.updateMany({
      data: {
        max_try_ons: TARGET_MAX_TRY_ONS,
        try_ons_used: TARGET_TRY_ONS_USED,
      },
    });

    console.log(
      `Updated ${result.count} users to max_try_ons=${TARGET_MAX_TRY_ONS} and try_ons_used=${TARGET_TRY_ONS_USED}.`,
    );
  } catch (error) {
    console.error('Failed to reset try-on limits:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

resetTryOnLimits();
