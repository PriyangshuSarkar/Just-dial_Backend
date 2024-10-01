import { randomBytes } from "crypto";
import {
  ChangeUserPasswordInput,
  ChangeUserPasswordSchema,
  FileUploadInput,
  FileUploadSchema,
  ForgetUserPasswordInput,
  ForgetUserPasswordSchema,
  UserLoginInput,
  UserLoginSchema,
  UserSignupInput,
  UserSignupSchema,
  VerifyUserEmailInput,
  VerifyUserEmailSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import cloudinary from "../../../utils/cloudinary";
// import { GraphQLUpload } from "graphql-upload/GraphQLUpload";
import { FileUpload } from "graphql-upload/Upload";

export const Mutation = {
  userSignup: async (_: unknown, args: UserSignupInput) => {
    // Validate input
    const validatedData = UserSignupSchema.parse(args);
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email, isVerified: true },
    });

    if (existingUser) {
      throw new Error("User already exists and email is verified!");
    }

    const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
      .toString()
      .padStart(6, "0");
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

    const sendOtpEmail = async (
      userName: string,
      email: string,
      otp: string,
    ): Promise<void> => {
      const emailSubject = "Confirm Your Email Address";
      const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
      await sendEmail(email, emailSubject, emailText);
    };

    await sendOtpEmail(newUser.name, newUser.email, otp);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      message: "User created! Please verify your email.",
    };
  },

  verifyUserEmail: async (_: unknown, args: VerifyUserEmailInput) => {
    const validatedData = VerifyUserEmailSchema.parse(args);

    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (!user) {
      throw new Error("Email doesn't exist!");
    }

    const currentTime = new Date();

    if (user.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (user.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const validatedUser = await prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        isVerified: true,
      },
    });

    const token = sign({ userId: validatedUser.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      message: "User OTP verified!",
      token: token,
    };
  },

  userLogin: async (_: unknown, args: UserLoginInput) => {
    const validatedData = UserLoginSchema.parse(args);

    const user = await prisma.user.findFirst({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new Error("Email doesn't exit!");
    }

    const verify = verifyPassword(
      validatedData.password,
      user.salt,
      user.password,
    );

    if (verify) {
      const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        message: "Logged in successful.",
        token: token,
      };
    } else {
      throw new Error("Wrong password!");
    }
  },

  forgetUserPassword: async (_: unknown, args: ForgetUserPasswordInput) => {
    const validatedData = ForgetUserPasswordSchema.parse(args);

    const sendOtpEmail = async (
      userName: string,
      email: string,
      otp: string,
    ) => {
      const emailSubject = "Password Reset OTP";
      const emailText = `Hello ${userName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

      await sendEmail(email, emailSubject, emailText);
    };

    const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
      .toString()
      .padStart(6, "0");

    const user = await prisma.user.update({
      where: { email: validatedData.email }, // Find the user by email
      data: {
        otp: otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(user.name, user.email, otp);

    return {
      message: `The password reset otp is sent at ${user.email}`,
    };
  },

  changeUserPassword: async (_: unknown, args: ChangeUserPasswordInput) => {
    const validatedData = ChangeUserPasswordSchema.parse(args);

    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
      },
    });
    if (!user) {
      throw new Error("Email doesn't exit!");
    }

    const currentTime = new Date();

    if (user.otpExpiresAt! < currentTime) {
      throw new Error("OTP has expired.");
    }

    if (user.otp! !== validatedData.otp) {
      throw new Error("OTP doesn't match!");
    }

    const verify = verifyPassword(
      validatedData.password,
      user.salt,
      user.password,
    );

    if (verify) {
      throw new Error("Password can't me same as last password.");
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await prisma.user.update({
      where: { email: user.email },
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

  uploadImage: async (_: unknown, { file }: { file: FileUpload }) => {
    // const { createReadStream, filename, mimetype, encoding } = await file;

    const validatedData = FileUploadSchema.parse(file);

    interface CloudinaryUploadResult {
      url: string;
      public_id: string;
      [key: string]: unknown; // To allow for any additional fields Cloudinary may include
    }

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (error) return reject(error);
          resolve(result as CloudinaryUploadResult);
        });

        validatedData.createReadStream().pipe(stream);
      },
    );

    return {
      url: result.url,
      publicId: result.public_id,
    };
  },
};
