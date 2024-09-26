import { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import {
  ChangeAdminPasswordRequest,
  ForgetAdminPasswordRequest,
  AdminLoginRequest,
  AdminSignupRequest,
  VerifyAdminEmailRequest,
} from "../types/admin";
import {
  ChangeAdminPasswordSchema,
  ForgetAdminPasswordSchema,
  AdminLoginSchema,
  AdminSignupSchema,
  VerifyAdminEmailSchema,
} from "../schemas/admin";
import { prisma } from "../utils/dbConnect";
import { randomBytes } from "crypto";
import { sendEmail } from "../utils/emailService";
import { hashPassword, verifyPassword } from "../utils/password";
import { sign } from "jsonwebtoken";

// * Admin Signup
export const adminSignup = tryCatch(
  async (
    request: Request<unknown, unknown, AdminSignupRequest>,
    response: Response,
  ) => {
    const validatedData = AdminSignupSchema.parse(request.body);

    const admin = await prisma.admin.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    const sendOtpEmail = async (
      adminName: string,
      email: string,
      otp: string,
    ) => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${adminName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };

    if (admin) {
      return response
        .status(400)
        .json({ error: "Admin already exists and email is verified! " });
    }

    const otp = randomBytes(3).toString("hex").substring(0, 6);

    const { salt, hash } = hashPassword(validatedData.password);

    const newAdmin = await prisma.admin.upsert({
      where: { email: validatedData.email }, // Find the admin by email
      update: {
        name: validatedData.name,
        password: hash,
        salt: salt,
        deletedAt: null,
        otp: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        name: validatedData.name,
        email: validatedData.email,
        password: hash,
        salt: salt,
        otp: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(newAdmin.name, newAdmin.email, otp);

    return response.status(201).json({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      message: "Admin created! Please verify your email.",
    });
  },
);

// * Validate Email
export const verifyAdminEmail = tryCatch(
  async (
    request: Request<unknown, unknown, VerifyAdminEmailRequest>,
    response: Response,
  ) => {
    const validatedData = VerifyAdminEmailSchema.parse(request.body);

    const admin = await prisma.admin.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (!admin) {
      return response.status(400).json({ message: "Email doesn't exist!" });
    }

    const currentTime = new Date();

    if (admin.otpExpiresAt! < currentTime) {
      return response.status(400).json({ message: "OTP has expired." });
    }

    if (admin.otp! !== validatedData.otp) {
      return response.status(400).json({ message: "OTP doesn't match!" });
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

    return response
      .status(200)
      .cookie("authToken", token, {
        httpOnly: true,
        maxAge:
          parseInt(process.env.JWT_EXPIRATION_TIME!, 10) * 24 * 60 * 60 * 1000,
      })
      .json({
        id: validatedAdmin.id,
        name: validatedAdmin.name,
        email: validatedAdmin.email,
        message: "Admin OTP verified!",
      });
  },
);

// *Admin Login
export const adminLogin = tryCatch(
  async (
    request: Request<unknown, unknown, AdminLoginRequest>,
    response: Response,
  ) => {
    const validatedData = AdminLoginSchema.parse(request.body);

    const admin = await prisma.admin.findFirst({
      where: { email: validatedData.email },
    });

    if (!admin) {
      return response.status(400).json({ massage: "Email doesn't exit!" });
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

      return response
        .status(200)
        .cookie("authToken", token, {
          httpOnly: true,
          maxAge:
            parseInt(process.env.JWT_EXPIRATION_TIME!, 10) *
            24 *
            60 *
            60 *
            1000,
        })
        .json({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          massage: "Logged in successful.",
        });
    } else {
      return response.status(400).json({ massage: "Wrong password!" });
    }
  },
);

// *Forget Admin Password
export const forgetAdminPassword = tryCatch(
  async (
    request: Request<unknown, unknown, ForgetAdminPasswordRequest>,
    response: Response,
  ) => {
    const validatedData = ForgetAdminPasswordSchema.parse(request.body);

    const sendOtpEmail = async (
      adminName: string,
      email: string,
      otp: string,
    ) => {
      const emailSubject = "Confirm Your Email Address";
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

    return response.status(200).json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      massage: "Password updated successfully.",
    });
  },
);

// *Change Admin Password
export const changeAdminPassword = tryCatch(
  async (
    request: Request<unknown, unknown, ChangeAdminPasswordRequest>,
    response: Response,
  ) => {
    const validatedData = ChangeAdminPasswordSchema.parse(request.body);

    const admin = await prisma.admin.findFirst({
      where: {
        email: validatedData.email,
      },
    });
    if (!admin) {
      return response.status(400).json({ massage: "Email doesn't exit!" });
    }

    const currentTime = new Date();

    if (admin.otpExpiresAt! < currentTime) {
      return response.status(400).json({ message: "OTP has expired." });
    }

    if (admin.otp! !== validatedData.otp) {
      return response.status(400).json({ message: "OTP doesn't match!" });
    }

    const verify = verifyPassword(
      validatedData.password,
      admin.salt,
      admin.password,
    );

    if (verify) {
      return response
        .status(400)
        .json({ message: "Password can't me same as last password." });
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await prisma.admin.update({
      where: { email: admin.email },
      data: {
        password: hash,
        salt: salt,
      },
    });

    return response.status(200).json({
      id: updatedPassword.id,
      name: updatedPassword.name,
      email: updatedPassword.email,
      massage: "Password updated successfully.",
    });
  },
);
