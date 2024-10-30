import {
  AddUserContactInput,
  AddUserContactSchema,
  ChangeUserPasswordInput,
  ChangeUserPasswordSchema,
  DeleteUserAccountInput,
  DeleteUserAccountSchema,
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
  VerifyUserContactInput,
  VerifyUserContactSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendOtpEmail } from "../../../utils/emailService";
import { generateToken, verifyToken } from "../../../utils/verifyToken";
import { uploadToCloudinary } from "../../../utils/cloudinary";
import slugify from "slugify";
import { v4 } from "uuid";
import { sendOtpPhone } from "../../../utils/smsService";
import { ContactType, Prisma } from "@prisma/client";
import { createOtpData } from "../../../utils/generateOtp";

const MAX_CONTACTS_PER_TYPE = 1;
const MAX_DAILY_VERIFICATION_ATTEMPTS = 5;

const ensurePrimaryContact = async (
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> => {
  const hasAnyPrimary = await tx.userContact.findFirst({
    where: {
      userId,
      isPrimary: true,
      isVerified: true,
      deletedAt: null,
    },
  });

  if (!hasAnyPrimary) {
    const mostRecentVerified = await tx.userContact.findFirst({
      where: {
        userId,
        isVerified: true,
        deletedAt: null,
      },
      orderBy: { verifiedAt: "desc" },
    });

    if (mostRecentVerified) {
      await tx.userContact.update({
        where: { id: mostRecentVerified.id },
        data: { isPrimary: true },
      });
    }
  }
};

const checkVerificationAttempts = async (
  tx: Prisma.TransactionClient,
  contactValue: string,
  type: ContactType
): Promise<void> => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const attempts = await tx.userContact.count({
    where: {
      value: contactValue,
      type,
      updatedAt: { gte: last24Hours },
      otp: { not: null },
    },
  });

  if (attempts >= MAX_DAILY_VERIFICATION_ATTEMPTS) {
    throw new Error(
      `Maximum verification attempts exceeded for this ${type.toLowerCase()}. Please try again in 24 hours.`
    );
  }
};

const cleanupUnverifiedContacts = async (
  tx: Prisma.TransactionClient,
  value: string,
  type: ContactType
): Promise<void> => {
  await tx.userContact.deleteMany({
    where: {
      value,
      type,
      isVerified: false,
      OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
    },
  });
};

export const userSignup = async (_: unknown, args: UserSignupInput) => {
  const validatedData = UserSignupSchema.parse(args);

  return await prisma.$transaction(async (tx) => {
    const existingContact = await tx.userContact.findFirst({
      where: {
        OR: [
          {
            value: validatedData.email,
            type: "EMAIL",
            isVerified: true,
            deletedAt: null,
          },
          {
            value: validatedData.email,
            type: "PHONE",
            isVerified: true,
            deletedAt: null,
          },
        ],
      },
    });

    if (existingContact) {
      throw new Error(
        `A verified user with this ${existingContact.type.toLowerCase()} already exists!`
      );
    }

    if (validatedData.email) {
      cleanupUnverifiedContacts(tx, validatedData.email, "EMAIL");
    }
    if (validatedData.phone) {
      cleanupUnverifiedContacts(tx, validatedData.phone, "PHONE");
    }

    // Generate OTPs
    const emailOtpData = validatedData.email ? createOtpData() : null;
    const phoneOtpData = validatedData.phone ? createOtpData() : null;

    // Create user
    const { salt, hash } = hashPassword(validatedData.password);
    const uuid = v4();
    const baseSlug = slugify(validatedData.name, { lower: true, strict: true });
    const slug = `${baseSlug}-${uuid}`;

    const user = await tx.user.create({
      data: {
        id: uuid,
        name: validatedData.name,
        slug,
        password: hash,
        salt,
      },
    });

    // Create contacts
    if (validatedData.email) {
      await tx.userContact.create({
        data: {
          userId: user.id,
          type: "EMAIL",
          value: validatedData.email,
          isPrimary: true,
          ...emailOtpData,
        },
      });
    }

    if (validatedData.phone) {
      await tx.userContact.create({
        data: {
          userId: user.id,
          type: "PHONE",
          value: validatedData.phone,
          isPrimary: !validatedData.email,
          ...phoneOtpData,
        },
      });
    }

    // Send verification codes
    try {
      if (validatedData.email && emailOtpData) {
        await sendOtpEmail(user.name, validatedData.email, emailOtpData.otp);
      }
      if (validatedData.phone && phoneOtpData) {
        await sendOtpPhone(user.name, validatedData.phone, phoneOtpData.otp);
      }
    } catch (error) {
      // Log error but don't fail the transaction
      console.error("Error sending OTP:", error);
    }

    return {
      value: [validatedData.email, validatedData.phone]
        .filter(Boolean)
        .join(" and "),
      message: `Verification code sent to your ${
        validatedData.email && validatedData.phone
          ? "email and phone"
          : validatedData.email
          ? "email"
          : "phone"
      }.`,
    };
  });
};

export const addUserContact = async (_: unknown, args: AddUserContactInput) => {
  const validatedData = AddUserContactSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);
  if (!owner?.userId || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Verify user exists and is not deleted
    const user = await tx.user.findFirst({
      where: {
        id: owner.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    // Check for existing contact
    const existingContact = await tx.userContact.findFirst({
      where: {
        value,
        type,
        isVerified: true,
        deletedAt: null,
      },
    });

    if (existingContact) {
      throw new Error(
        `This ${type.toLowerCase()} is already registered and verified by a user!`
      );
    }

    cleanupUnverifiedContacts(tx, value!, type);

    // Check contact limit for the current user
    const existingContactsCount = await tx.userContact.count({
      where: {
        userId: owner.userId,
        type,
        deletedAt: null,
      },
    });

    if (existingContactsCount >= MAX_CONTACTS_PER_TYPE) {
      throw new Error(
        `Maximum number of ${type.toLowerCase()} contacts (${MAX_CONTACTS_PER_TYPE}) reached`
      );
    }

    // Check verification attempts
    await checkVerificationAttempts(tx, value!, type);

    // Create new contact
    const otpData = createOtpData();
    const newContact = await tx.userContact.create({
      data: {
        userId: owner.userId,
        type,
        value: value!,
        ...otpData,
      },
      include: {
        user: true,
      },
    });

    // Send OTP
    try {
      if (type === "EMAIL") {
        await sendOtpEmail(newContact.user.name, value!, otpData.otp);
      } else {
        await sendOtpPhone(newContact.user.name, value!, otpData.otp);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Delete the contact if OTP sending fails
      await tx.userContact.delete({
        where: { id: newContact.id },
      });
      throw new Error(
        `Failed to send verification code to ${type.toLowerCase()}`
      );
    }

    return {
      value,
      message: `Verification code sent to your ${type.toLowerCase()}`,
    };
  });
};

export const verifyUserContact = async (
  _: unknown,
  args: VerifyUserContactInput
) => {
  const validatedData = VerifyUserContactSchema.parse(args);

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const contact = await tx.userContact.findFirst({
      where: {
        value,
        type,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!contact.otp || !contact.otpExpiresAt) {
      throw new Error("No verification code found. Please request a new one.");
    }

    if (contact.otpExpiresAt < new Date()) {
      throw new Error(
        "Verification code has expired. Please request a new one."
      );
    }

    if (contact.otp !== validatedData.otp) {
      throw new Error("Invalid verification code");
    }

    // Verify the contact
    const verifiedContact = await tx.userContact.update({
      where: { id: contact.id, value },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        otp: null,
        otpExpiresAt: null,
      },
      include: {
        user: {
          include: {
            contacts: true,
            address: true,
          },
        },
      },
    });

    // Ensure there's a primary contact
    await ensurePrimaryContact(tx, contact.userId);
    const token = generateToken(verifiedContact.userId, "USER");

    return {
      ...verifiedContact.user,
      token,
      message: `${type === "EMAIL" ? "Email" : "Phone"} verified successfully!`,
    };
  });
};

export const userMe = async (_: unknown, args: UserMeInput) => {
  const validatedData = UserMeSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: owner.id,
      deletedAt: null,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      contacts: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      bookings: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  return {
    ...user,
  };
};

export const userLogin = async (_: unknown, args: UserLoginInput) => {
  const validatedData = UserLoginSchema.parse(args);

  const value = validatedData.email || validatedData.phone;

  const existingContact = await prisma.userContact.findFirst({
    where: {
      value,
      isVerified: true,
      deletedAt: null,
    },
  });

  if (!existingContact) {
    throw new Error(`${value} doesn't exit!`);
  }

  const user = await prisma.user.findFirst({
    where: {
      id: existingContact?.userId,
      deletedAt: null,
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

  if (!user) {
    throw new Error(`User not found!`);
  }

  const verify = verifyPassword(
    validatedData.password,
    user.salt,
    user.password
  );

  if (verify) {
    const token = generateToken(user.id, "USER");
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

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.userContact.findFirst({
      where: {
        value,
        isVerified: true,
        deletedAt: null,
      },
    });

    if (!existingContact) {
      throw new Error(
        `${
          validatedData.email ? validatedData.email : validatedData.phone
        } doesn't exit!`
      );
    }
    // Check verification attempts
    await checkVerificationAttempts(tx, value!, type);

    // Create new contact
    const otpData = createOtpData();
    const newContact = await tx.userContact.create({
      data: {
        userId: existingContact.userId,
        type,
        value: value!,
        ...otpData,
      },
      include: {
        user: true,
      },
    });

    // Send OTP
    try {
      if (type === "EMAIL") {
        await sendOtpEmail(newContact.user.name, value!, otpData.otp);
      } else {
        await sendOtpPhone(newContact.user.name, value!, otpData.otp);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Delete the contact if OTP sending fails
      await tx.userContact.delete({
        where: { id: newContact.id },
      });
      throw new Error(
        `Failed to send verification code to ${type.toLowerCase()}`
      );
    }
    return {
      value: value,
      message: `Verification code sent to your ${type.toLowerCase()}`,
    };
  });
};

export const changeUserPassword = async (
  _: unknown,
  args: ChangeUserPasswordInput
) => {
  const validatedData = ChangeUserPasswordSchema.parse(args);

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.userContact.findFirst({
      where: {
        value,
        isVerified: true,
        deletedAt: null,
      },
    });

    if (!existingContact) {
      throw new Error(
        `${
          validatedData.email ? validatedData.email : validatedData.phone
        } doesn't exit!`
      );
    }

    if (!existingContact) {
      throw new Error("Contact not found");
    }

    if (!existingContact.otp || !existingContact.otpExpiresAt) {
      throw new Error("No verification code found. Please request a new one.");
    }

    if (existingContact.otpExpiresAt < new Date()) {
      throw new Error(
        "Verification code has expired. Please request a new one."
      );
    }

    if (existingContact.otp !== validatedData.otp) {
      throw new Error("Invalid verification code");
    }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await tx.user.update({
      where: {
        id: existingContact.userId,
        deletedAt: null,
      },
      data: {
        password: hash,
        salt,
      },
    });

    return {
      ...updatedPassword,
      massage: "Password updated successfully.",
    };
  });
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
    where: {
      id: owner.id,
      deletedAt: null,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  await prisma.$transaction(async (tx) => {
    const newPrimaryContact = await tx.userContact.findFirst({
      where: {
        id: validatedData.contactId,
        userId: user.id,
        isVerified: true,
        deletedAt: null,
      },
    });

    if (!newPrimaryContact) {
      throw new Error("Contact not found or not verified");
    }

    await tx.userContact.updateMany({
      where: {
        userId: user.id,
        type: newPrimaryContact.type,
        isPrimary: true,
        deletedAt: null,
      },
      data: {
        isPrimary: false,
      },
    });
    await tx.userContact.update({
      where: {
        id: validatedData.contactId,
      },
      data: {
        isPrimary: true,
      },
    });
  });
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
    where: { id: user.id, deletedAt: null },
    data: {
      name: validatedData.name || user.name,
      avatar: avatarUrl || user.avatar,
      hideDetails: validatedData.hideDetails || user.hideDetails,
    },
    include: {
      contacts: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      bookings: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return {
    ...updatedUser,
    message: "User details updated successfully.",
  };
};

export const deleteUserAccount = async (
  _: unknown,
  args: DeleteUserAccountInput
) => {
  const validatedData = DeleteUserAccountSchema.parse(args);
  const owner: any = verifyToken(validatedData.token);
  if (!owner?.userId || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Check if user exists
    const user = await tx.user.findFirst({
      where: {
        id: owner.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Soft delete user contacts
    await tx.userContact.updateMany({
      where: {
        userId: owner.userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isVerified: false,
        isPrimary: false,
      },
    });

    // Soft delete user address if exists
    if (user.addressId) {
      await tx.address.update({
        where: {
          id: user.addressId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Soft delete the user
    const deletedUser = await tx.user.update({
      where: {
        id: owner.userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      ...deletedUser,
      message: "Account deleted successfully",
    };
  });
};
