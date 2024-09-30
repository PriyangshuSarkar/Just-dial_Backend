import { randomBytes } from "crypto";
import {
  ChangeAdminPasswordInput,
  ChangeAdminPasswordSchema,
  ForgetAdminPasswordInput,
  ForgetAdminPasswordSchema,
  AdminLoginInput,
  AdminLoginSchema,
  AdminSignupInput,
  AdminSignupSchema,
  VerifyAdminEmailInput,
  VerifyAdminEmailSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";

export const Mutation = {
  adminSignup: async (_: unknown, args: AdminSignupInput) => {
    // Validate input
    const validatedData = AdminSignupSchema.parse(args);
    const existingAdmin = await prisma.admin.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    if (existingAdmin) {
      throw new Error("Admin already exists and email is verified!");
    }

    const otp = randomBytes(3).toString("hex").substring(0, 6);
    const { salt, hash } = hashPassword(validatedData.password);

    const newAdmin = await prisma.admin.upsert({
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

    const sendOtpEmail = async (
      adminName: string,
      email: string,
      otp: string,
    ): Promise<void> => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${adminName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
      await sendEmail(email, emailSubject, emailText);
    };

    await sendOtpEmail(newAdmin.name, newAdmin.email, otp);

    return {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      message: "Admin created! Please verify your email.",
    };
  },

  verifyAdminEmail: async (_: unknown, args: VerifyAdminEmailInput) => {
    const validatedData = VerifyAdminEmailSchema.parse(args);

    const admin = await prisma.admin.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (!admin) {
      throw new Error("Email doesn't exist!");
    }

    const currentTime = new Date();

    if (admin.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (admin.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const validatedAdmin = await prisma.admin.update({
      where: {
        email: admin.email,
      },
      data: {
        isVerified: true,
      },
    });

    const token = sign(
      { adminId: validatedAdmin.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      },
    );

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      message: "Admin OTP verified!",
      token: token,
    };
  },

  adminLogin: async (_: unknown, args: AdminLoginInput) => {
    const validatedData = AdminLoginSchema.parse(args);

    const admin = await prisma.admin.findFirst({
      where: { email: validatedData.email },
    });

    if (!admin) {
      throw new Error("Email doesn't exit!");
    }

    const verify = verifyPassword(
      validatedData.password,
      admin.salt,
      admin.password,
    );

    if (verify) {
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
  },

  forgetAdminPassword: async (_: unknown, args: ForgetAdminPasswordInput) => {
    const validatedData = ForgetAdminPasswordSchema.parse(args);

    const sendOtpEmail = async (
      adminName: string,
      email: string,
      otp: string,
    ) => {
      const emailSubject = "Password Reset OTP";
      const emailText = `Hello ${adminName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };

    const otp = randomBytes(3).toString("hex").substring(0, 6);

    const admin = await prisma.admin.update({
      where: { email: validatedData.email }, // Find the admin by email
      data: {
        otp: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(admin.name, admin.email, otp);

    return {
      message: `The password reset otp is sent at ${admin.email}`,
    };
  },

  changeAdminPassword: async (_: unknown, args: ChangeAdminPasswordInput) => {
    const validatedData = ChangeAdminPasswordSchema.parse(args);

    const admin = await prisma.admin.findFirst({
      where: {
        email: validatedData.email,
      },
    });
    if (!admin) {
      throw new Error("Email doesn't exit!");
    }

    const currentTime = new Date();

    if (admin.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (admin.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const verify = verifyPassword(
      validatedData.password,
      admin.salt,
      admin.password,
    );

    if (verify) {
      throw new Error("Password can't me same as last password.");
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await prisma.admin.update({
      where: { email: admin.email },
      data: {
        password: hash,
        salt: salt,
      },
    });

    return {
      id: updatedPassword.id,
      name: updatedPassword.name,
      email: updatedPassword.email,
      massage: "Password updated successfully.",
    };
  },
};
