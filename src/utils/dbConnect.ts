import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const dbConnect = async () => {
  try {
    await prisma.$connect();
    console.log("Database Connected.");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

// Handle graceful shutdown by disconnecting Prisma client
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
  process.exit(0); // Exit the process cleanly
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
  process.exit(0);
});
