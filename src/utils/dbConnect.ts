import { PrismaClient as PrismaClient1 } from "../../prisma/generated/client1";
import { PrismaClient as PrismaClient2 } from "../../prisma/generated/client2";

export const prisma = new PrismaClient1();
export const prismaBackup = new PrismaClient2();

export const dbConnect = async () => {
  try {
    await prisma.$connect();
    await prismaBackup.$connect();
    console.log("Database Connected.");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
