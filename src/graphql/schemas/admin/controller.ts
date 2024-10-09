import { AdminLoginInput, AdminLoginSchema } from "./db";
import { prisma } from "../../../utils/dbConnect";
import { sign } from "jsonwebtoken";

export const adminLogin = async (_: unknown, args: AdminLoginInput) => {
  const validatedData = AdminLoginSchema.parse(args);

  const admin = await prisma.admin.findFirst({
    where: { email: validatedData.email },
  });

  if (!admin) {
    throw new Error("Email doesn't exit!");
  }

  if (admin.password === validatedData.password) {
    const token = sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      message: "Logged in successful.",
      token: token,
    };
  } else {
    throw new Error("Wrong password!");
  }
};
