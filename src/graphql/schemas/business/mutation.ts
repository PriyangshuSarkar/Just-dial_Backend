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
  UpdateBusinessDetailsInput,
  UpdateBusinessDetailsSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import { verifyToken } from "../../middlewares/verifyToken";

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

    const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
      .toString()
      .padStart(6, "0");
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
      otp: string
    ): Promise<void> => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
      await sendEmail(email, emailSubject, emailText);
    };

    await sendOtpEmail(newBusiness.name, newBusiness.email, otp);

    return {
      ...newBusiness,
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
      }
    );

    return {
      ...validatedBusiness,
      message: "Business OTP verified!",
      token: token,
    };
  },

  businessLogin: async (_: unknown, args: BusinessLoginInput) => {
    const validatedData = BusinessLoginSchema.parse(args);

    const business = await prisma.business.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    if (!business) {
      throw new Error("Email doesn't exit!");
    }

    const verify = verifyPassword(
      validatedData.password,
      business.salt,
      business.password
    );

    if (verify) {
      const token = sign({ businessId: business.id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      });

      return {
        ...business,
        message: "Logged in successful.",
        token: token,
      };
    } else {
      throw new Error("Wrong password!");
    }
  },

  forgetBusinessPassword: async (
    _: unknown,
    args: ForgetBusinessPasswordInput
  ) => {
    const validatedData = ForgetBusinessPasswordSchema.parse(args);

    const sendOtpEmail = async (
      businessName: string,
      email: string,
      otp: string
    ) => {
      const emailSubject = "Password Reset OTP";
      const emailText = `Hello ${businessName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };

    const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
      .toString()
      .padStart(6, "0");

    const business = await prisma.business.update({
      where: { email: validatedData.email, isVerified: true }, // Find the business by email
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
    args: ChangeBusinessPasswordInput
  ) => {
    const validatedData = ChangeBusinessPasswordSchema.parse(args);

    const business = await prisma.business.findFirst({
      where: {
        email: validatedData.email,
        isVerified: true,
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
      business.password
    );

    if (verify) {
      throw new Error("Password can't me same as last password.");
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await prisma.business.update({
      where: { email: business.email, isVerified: true },
      data: {
        password: hash,
        salt: salt,
      },
    });

    return {
      ...updatedPassword,
      massage: "Password updated successfully.",
    };
  },

  updateBusinessDetails: async (
    _: unknown,
    args: UpdateBusinessDetailsInput
  ) => {
    const validatedData = UpdateBusinessDetailsSchema.parse(args);

    const owner: any = verifyToken(validatedData.token);

    if (!owner || typeof owner.userId !== "string") {
      throw new Error("Invalid or missing token");
    }

    const business = await prisma.business.findUnique({
      where: { id: owner.businessId, isVerified: true },
      include: { address: true },
    });

    if (!business) {
      throw new Error("Business not found!");
    }

    if (validatedData.address) {
      await prisma.address.upsert({
        where: { businessId: business.id },
        update: {
          street: validatedData.address.street || business.address?.street,
          city: validatedData.address.city || business.address?.city,
          state: validatedData.address.state || business.address?.state,
          pincode: validatedData.address.pincode || business.address?.pincode,
        },
        create: {
          businessId: business.id,
          street: validatedData.address.street,
          city: validatedData.address.city,
          state: validatedData.address.state,
          pincode: validatedData.address.pincode,
        },
      });
    }

    // Update business details
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id, isVerified: true },
      data: {
        website: validatedData.website || business.website,
        name: validatedData.name || business.name,
        phone: validatedData.phone || business.phone,
        type: validatedData.type || business.type,
      },
      include: { address: true }, // Include updated address in response if needed
    });

    return {
      ...updatedBusiness,
      message: "Business details updated successfully.",
    };
  },
};
