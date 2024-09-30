import { randomBytes } from "crypto";
import {
  ChangeBusinessPasswordInput,
  ChangeBusinessPasswordSchema,
  ForgetBusinessPasswordInput,
  ForgetBusinessPasswordSchema,
  BusinessLoginInput,
  BusinessLoginSchema,
  BusinessSignupInput,
  BusinessSignupSchema,
  VerifyBusinessEmailInput,
  VerifyBusinessEmailSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";

export const Mutation = {
  businessSignup: async (_: unknown, args: BusinessSignupInput) => {
    // Validate input
    const validatedData = BusinessSignupSchema.parse(args);
    const existingBusiness = await prisma.business.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    if (existingBusiness) {
      throw new Error("Business already exists and email is verified!");
    }

    const otp = randomBytes(3).toString("hex").substring(0, 6);
    const { salt, hash } = hashPassword(validatedData.password);

    const newBusiness = await prisma.business.upsert({
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
      businessName: string,
      email: string,
      otp: string,
    ): Promise<void> => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
      await sendEmail(email, emailSubject, emailText);
    };

    await sendOtpEmail(newBusiness.name, newBusiness.email, otp);

    return {
      id: newBusiness.id,
      name: newBusiness.name,
      email: newBusiness.email,
      message: "Business created! Please verify your email.",
    };
  },

  verifyBusinessEmail: async (_: unknown, args: VerifyBusinessEmailInput) => {
    const validatedData = VerifyBusinessEmailSchema.parse(args);

    const business = await prisma.business.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (!business) {
      throw new Error("Email doesn't exist!");
    }

    const currentTime = new Date();

    if (business.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (business.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const validatedBusiness = await prisma.business.update({
      where: {
        email: business.email,
      },
      data: {
        isVerified: true,
      },
    });

    const token = sign(
      { businessId: validatedBusiness.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      },
    );

    return {
      id: business.id,
      name: business.name,
      email: business.email,
      message: "Business OTP verified!",
      token: token,
    };
  },

  businessLogin: async (_: unknown, args: BusinessLoginInput) => {
    const validatedData = BusinessLoginSchema.parse(args);

    const business = await prisma.business.findFirst({
      where: { email: validatedData.email },
    });

    if (!business) {
      throw new Error("Email doesn't exit!");
    }

    const verify = verifyPassword(
      validatedData.password,
      business.salt,
      business.password,
    );

    if (verify) {
      const token = sign({ businessId: business.id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      });

      return {
        id: business.id,
        name: business.name,
        email: business.email,
        message: "Logged in successful.",
        token: token,
      };
    } else {
      throw new Error("Wrong password!");
    }
  },

  forgetBusinessPassword: async (
    _: unknown,
    args: ForgetBusinessPasswordInput,
  ) => {
    const validatedData = ForgetBusinessPasswordSchema.parse(args);

    const sendOtpEmail = async (
      businessName: string,
      email: string,
      otp: string,
    ) => {
      const emailSubject = "Password Reset OTP";
      const emailText = `Hello ${businessName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };

    const otp = randomBytes(3).toString("hex").substring(0, 6);

    const business = await prisma.business.update({
      where: { email: validatedData.email }, // Find the business by email
      data: {
        otp: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(business.name, business.email, otp);

    return {
      message: `The password reset otp is sent at ${business.email}`,
    };
  },

  changeBusinessPassword: async (
    _: unknown,
    args: ChangeBusinessPasswordInput,
  ) => {
    const validatedData = ChangeBusinessPasswordSchema.parse(args);

    const business = await prisma.business.findFirst({
      where: {
        email: validatedData.email,
      },
    });
    if (!business) {
      throw new Error("Email doesn't exit!");
    }

    const currentTime = new Date();

    if (business.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (business.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const verify = verifyPassword(
      validatedData.password,
      business.salt,
      business.password,
    );

    if (verify) {
      throw new Error("Password can't me same as last password.");
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await prisma.business.update({
      where: { email: business.email },
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
