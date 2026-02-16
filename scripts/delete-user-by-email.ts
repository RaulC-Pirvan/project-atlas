import 'dotenv/config';

import { prisma } from '../src/lib/db/prisma';

async function main() {
  const rawEmail = process.argv[2];
  const email = rawEmail?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      'Usage: npx ts-node --project tsconfig.seed.json scripts/delete-user-by-email.ts <email>',
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    console.log(`NOT_FOUND:${email}`);
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`DELETED:${user.email}:${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
