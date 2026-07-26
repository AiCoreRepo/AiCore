/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

if (typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

const prisma = new PrismaClient();
const DEMO_EMAIL = 'pulkitgupta6677@gmail.com';
const DEMO_RESET_MARKER = -1;

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: {
      user_id: true,
      email: true,
      aura: { select: { aura_id: true } },
    },
  });

  if (!user) {
    throw new Error(
      `${DEMO_EMAIL} does not exist in this database. Sign in once before running the reset.`,
    );
  }
  if (!user.aura) {
    throw new Error(
      `Pulkit's preloaded Aura is missing. Sign in once to provision it before replaying the demo.`,
    );
  }

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      try_ons_used: 0,
      avatar_regenerations_used: 0,
      has_created_aura: false,
      max_avatar_regenerations: DEMO_RESET_MARKER,
    },
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        email: user.email,
        preserved: [
          'Existing Aura database record',
          'Existing try-on history',
          'Cloudinary avatar asset',
          'Five static Cloudinary try-on results',
          'Men’s collection products and metadata',
        ],
        next:
          'Refresh or sign in with Google. Complete the prefilled form to replay the loading screen and restore the same fixed avatar.',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
