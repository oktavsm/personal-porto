import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/plugins/auth.js";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "Oktavianus Samuel";

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to bootstrap the admin user.");
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: await hashPassword(adminPassword),
      name: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      name: adminName,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
