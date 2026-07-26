/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

if (typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

const prisma = new PrismaClient();
const DEMO_EMAILS = [
  'pulkitgupta6677@gmail.com',
  'rushabhbelani2212@gmail.com',
];
const DEMO_RESET_MARKER = -1;

async function main() {
  const emailFlagIndex = process.argv.indexOf('--email');
  const requestedEmail =
    emailFlagIndex >= 0 ? process.argv[emailFlagIndex + 1]?.toLowerCase() : null;
  const emails = requestedEmail ? [requestedEmail] : DEMO_EMAILS;

  if (requestedEmail && !DEMO_EMAILS.includes(requestedEmail)) {
    throw new Error(`Unsupported static demo account: ${requestedEmail}`);
  }

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: {
      user_id: true,
      email: true,
      aura: { select: { aura_id: true } },
    },
  });
  const missing = emails.filter(
    (email) => !users.some((user) => user.email.toLowerCase() === email),
  );
  if (missing.length) {
    throw new Error(
      `Demo account seed is missing for: ${missing.join(', ')}. Run scripts/seed-products.js first.`,
    );
  }
  const missingAuras = users.filter((user) => !user.aura);
  if (missingAuras.length) {
    throw new Error(
      `Preloaded Aura is missing for: ${missingAuras.map(({ email }) => email).join(', ')}`,
    );
  }

  await prisma.user.updateMany({
    where: { email: { in: emails } },
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
        emails: users.map(({ email }) => email),
        preserved: [
          'Existing Aura database record',
          'Existing try-on history',
          'Cloudinary avatar asset',
          'Five static Cloudinary try-on results',
          'Men’s collection products and metadata',
        ],
        next:
          'Refresh or sign in with Google. Complete the prefilled form to replay the loading screen and restore the same fixed avatar. Use --email address@example.com to reset only one demo account.',
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
