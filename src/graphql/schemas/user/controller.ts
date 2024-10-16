import { randomBytes } from "crypto";
import {
  ChangeUserPasswordInput,
  ChangeUserPasswordSchema,
  ForgetUserPasswordInput,
  ForgetUserPasswordSchema,
  UpdateUserDetailsInput,
  UpdateUserDetailsSchema,
  UserLoginInput,
  UserLoginSchema,
  UserMeInput,
  UserMeSchema,
  UserSignupInput,
  UserSignupSchema,
  VerifyUserEmailInput,
  VerifyUserEmailSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import { verifyToken } from "../../../utils/verifyToken";
import { uploadToCloudinary } from "../../../utils/cloudinary";

export const userMe = async (_: unknown, args: UserMeInput) => {
  const validatedData = UserMeSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirst({
    where: { id: owner.id, isVerified: true, deletedAt: null },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      reviews: true,
      bookings: true,
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  return {
    ...user,
  };
};

export const userSignup = async (_: unknown, args: UserSignupInput) => {
  // Validate input
  const validatedData = UserSignupSchema.parse(args);
  const existingUser = await prisma.user.findFirst({
    where: { email: validatedData.email, isVerified: true, deletedAt: null },
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
    otp: string
  ): Promise<void> => {
    const emailSubject = "Confirm Your Email Address";
    const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
    await sendEmail(email, emailSubject, emailText);
  };

  await sendOtpEmail(newUser.name, newUser.email, otp);

  return {
    email: newUser.email,
    message: "User created! Please verify your email.",
  };
};

export const verifyUserEmail = async (
  _: unknown,
  args: VerifyUserEmailInput
) => {
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
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  const token = sign({ userId: validatedUser.id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRATION_TIME!,
  });

  return {
    ...validatedUser,
    message: "User OTP verified!",
    token: token,
  };
};

export const userLogin = async (_: unknown, args: UserLoginInput) => {
  const validatedData = UserLoginSchema.parse(args);

  const user = await prisma.user.findFirst({
    where: { email: validatedData.email, isVerified: true, deletedAt: null },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Email doesn't exit!");
  }

  const verify = verifyPassword(
    validatedData.password,
    user.salt,
    user.password
  );

  if (verify) {
    const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return {
      ...user,
      message: "Logged in successful.",
      token: token,
    };
  } else {
    throw new Error("Wrong password!");
  }
};

export const forgetUserPassword = async (
  _: unknown,
  args: ForgetUserPasswordInput
) => {
  const validatedData = ForgetUserPasswordSchema.parse(args);

  const sendOtpEmail = async (userName: string, email: string, otp: string) => {
    const emailSubject = "Password Reset OTP";
    const emailText = `Hello ${userName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

    await sendEmail(email, emailSubject, emailText);
  };

  const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");

  const user = await prisma.user.update({
    where: { email: validatedData.email, isVerified: true, deletedAt: null }, // Find the user by email
    data: {
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOtpEmail(user.name, user.email, otp);

  return {
    message: `The password reset otp is sent at ${user.email}`,
  };
};

export const changeUserPassword = async (
  _: unknown,
  args: ChangeUserPasswordInput
) => {
  const validatedData = ChangeUserPasswordSchema.parse(args);

  const user = await prisma.user.findFirst({
    where: {
      email: validatedData.email,
      isVerified: true,
      deletedAt: null,
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
    user.password
  );

  if (verify) {
    throw new Error("Password can't me same as last password.");
  }

  const { salt, hash } = hashPassword(validatedData.password);

  const updatedPassword = await prisma.user.update({
    where: { email: user.email, isVerified: true, deletedAt: null },
    data: {
      password: hash,
      salt: salt,
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  return {
    ...updatedPassword,
    massage: "Password updated successfully.",
  };
};

export const updateUserDetails = async (
  _: unknown,
  args: UpdateUserDetailsInput
) => {
  const validatedData = UpdateUserDetailsSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findUnique({
    where: { id: owner.userId, isVerified: true, deletedAt: null },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  let avatarUrl: string | undefined;

  // Handle avatar upload if provided
  if (validatedData.avatar) {
    avatarUrl = (await uploadToCloudinary(
      [validatedData.avatar],
      "avatars"
    )) as string;
  }

  // Update user name and phone
  const updatedUser = await prisma.user.update({
    where: { id: user.id, isVerified: true, deletedAt: null },
    data: {
      name: validatedData.name || user.name,
      phone: validatedData.phone || user.phone,
      avatar: avatarUrl || user.avatar,
      hideDetails: validatedData.hideDetails || user.hideDetails,
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  return {
    ...updatedUser,
    message: "User details updated successfully.",
  };
};
