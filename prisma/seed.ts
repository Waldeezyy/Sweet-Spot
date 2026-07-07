import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
