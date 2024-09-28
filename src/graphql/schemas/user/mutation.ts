import { randomBytes } from "crypto";
import { UserSignupSchema } from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";

export const Mutation = {
  signup: async (
    _: unknown,
    args: { name: string; email: string; password: string },
  ) => {
    // Validate input
    const validatedData = UserSignupSchema.parse(args);
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    if (existingUser) {
      throw new Error("User already exists and email is verified!");
    }

    const otp = randomBytes(3).toString("hex").substring(0, 6);
    const { salt, hash } = hashPassword(validatedData.password);

    const newUser = await prisma.user.upsert({
      where: { email: validatedData.email },
      update: {
        name: validatedData.name,
        password: hash,
        salt,
        deletedAt: null,
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        name: validatedData.name,
        email: validatedData.email,
        password: hash,
        salt,
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(newUser.name, newUser.email, otp);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      message: "User created! Please verify your email.",
    };
  },
};

const sendOtpEmail = async (
  userName: string,
  email: string,
  otp: string,
): Promise<void> => {
  const emailSubject = "Confirm Your Email Address";
  const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
  await sendEmail(email, emailSubject, emailText);
};
