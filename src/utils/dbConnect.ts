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
