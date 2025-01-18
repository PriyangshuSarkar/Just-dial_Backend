import {
  AddUserContactInput,
  AddUserContactSchema,
  ChangeUserPasswordInput,
  ChangeUserPasswordSchema,
  ForgetUserPasswordInput,
  ForgetUserPasswordSchema,
  ManageUserAddressInput,
  ManageUserAddressSchema,
  ResendUserOtpInput,
  ResendUserOtpSchema,
  UpdateUserDetailsInput,
  UpdateUserDetailsSchema,
  UserGoogleOAuthInput,
  UserGoogleOAuthSchema,
  UserGoogleOAuthVerifyInput,
  UserGoogleOAuthVerifySchema,
  UserLoginInput,
  UserLoginSchema,
  UserSignupInput,
  UserSignupSchema,
  UserSubscriptionInput,
  UserSubscriptionSchema,
  UserVerifyPaymentInput,
  UserVerifyPaymentSchema,
  VerifyUserContactInput,
  VerifyUserContactSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { generateToken } from "../../../utils/token";
import slugify from "slugify";
import { ContactType, Prisma } from "@prisma/client";
import { uploadToSpaces } from "../../../utils/bucket";
import { sendOtpEmail } from "../../../utils/emailService";
import { sendOtpPhone } from "../../../utils/phoneService";
import { verifyOtp } from "../../../utils/verifyOtp";
import { verifyCode } from "../../../utils/oAuthVerify";
import { initiateOAuth } from "../../../utils/oAuth";
import { razorpay } from "../../../utils/razorpay";
import { createHmac } from "crypto";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);

const MAX_CONTACTS_PER_TYPE = parseInt(
  process.env.MAX_CONTACTS_PER_TYPE || "1",
  1
);
const MAX_DAILY_VERIFICATION_ATTEMPTS = parseInt(
  process.env.MAX_DAILY_VERIFICATION_ATTEMPTS || "10",
  10
);
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
      // otp: { not: null },
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

export const userGoogleOAuth = async (
  _: unknown,
  args: UserGoogleOAuthInput
) => {
  const validatedData = UserGoogleOAuthSchema.parse(args);

  if (!validatedData) return;

  const response = await initiateOAuth(validatedData.redirectURI);

  return response;
};

export const userGoogleOAuthVerify = async (
  _: unknown,
  args: UserGoogleOAuthVerifyInput
) => {
  const validatedData = UserGoogleOAuthVerifySchema.parse(args);

  if (!validatedData) return;

  const response = await verifyCode(validatedData.code);

  const requestId = response.requestId;

  const message = response.message;

  const userDetails = response.userDetails;

  const user = await prisma.user.findFirst({
    where: {
      contacts: {
        some: {
          value: userDetails.identities[0].identityValue,
          isVerified: true,
          deletedAt: null,
        },
      },
    },
  });

  if (user) {
    if (user.isBlocked) {
      throw new Error("User is blocked");
    }
    return {
      token: generateToken(user.id, "USER"),
      ...user,
      requestId,
      message,
    };
  }

  const newUser = await prisma.user.create({
    data: {
      name: userDetails.name || "Please add name",
      contacts: {
        create: {
          value: userDetails.identities[0].identityValue,
          type: userDetails.identities[0].identityType as ContactType,
          isVerified: true,
        },
      },
    },
    include: {
      contacts: true,
    },
  });

  return {
    token: generateToken(newUser.id, "USER"),
    ...newUser,
    requestId,
    message,
  };
};
export const userSignup = async (_: unknown, args: UserSignupInput) => {
  const validatedData = UserSignupSchema.parse(args);

  if (!validatedData) return;

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
            value: validatedData.phone,
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
    // const emailOtpData = validatedData.email ? createOtpData() : null;
    // const phoneOtpData = validatedData.phone ? createOtpData() : null;

    // Create user
    const { salt, hash } = hashPassword(validatedData.password);
    let slug = slugify(validatedData.name, { lower: true, strict: true });
    let uniqueSuffixLength = 2;
    let existingSlug = await prisma.user.findFirst({ where: { slug } });

    while (existingSlug) {
      const uniqueSuffix = Math.random()
        .toString(16)
        .slice(2, 2 + uniqueSuffixLength);
      slug = `${slugify(validatedData.name, {
        lower: true,
        strict: true,
      })}-${uniqueSuffix}`;
      existingSlug = await prisma.user.findFirst({ where: { slug } });
      uniqueSuffixLength += 1;
    }

    const user = await tx.user.create({
      data: {
        name: validatedData.name,
        slug,
        password: hash,
        salt,
      },
    });

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    let requestId: string | undefined;
    let reachedIdEmail: string | undefined;
    let reachedIdPhone: string | undefined;
    // Send verification codes
    try {
      if (validatedData.email && otpExpiresAt) {
        const response = await sendOtpEmail(
          user.name,
          validatedData.email,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
        reachedIdEmail = response.requestId;
      } else if (validatedData.phone && otpExpiresAt) {
        const response = await sendOtpPhone(
          user.name,
          validatedData.phone,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
        reachedIdPhone = response.requestId;
      }
    } catch (error) {
      // Log error but don't fail the transaction
      console.error("Error sending OTP:", error);
    }

    // Create contacts
    if (validatedData.email) {
      await tx.userContact.create({
        data: {
          user: {
            connect: { id: user.id },
          },
          type: "EMAIL",
          value: validatedData.email,
          isPrimary: true,
          otp: reachedIdEmail,
          otpExpiresAt: reachedIdEmail ? otpExpiresAt : null,
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
          otp: reachedIdPhone,
          otpExpiresAt: reachedIdPhone ? otpExpiresAt : null,
        },
      });
    }

    return {
      value: validatedData.email || validatedData.phone,
      message: `Verification code sent to ${
        validatedData.email || validatedData.phone
      }.`,
      requestId,
    };
  });
};

export const resendUserOtp = async (_: unknown, args: ResendUserOtpInput) => {
  const validatedData = ResendUserOtpSchema.parse(args);

  if (!validatedData) return;

  const type = validatedData.email ? "EMAIL" : "PHONE";
  const value = validatedData.email || validatedData.phone;

  if (!value) return;

  const now = new Date();

  // Start a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Retrieve the user's current OTP details
    const contact = await tx.userContact.findUnique({
      where: { value },
      select: { otpExpiresAt: true, user: { select: { name: true } } },
    });

    if (!contact) {
      throw new Error("User not found");
    }

    // Use the checkVerificationAttempts function to check the attempts
    await checkVerificationAttempts(tx, value, type);

    if (
      contact?.otpExpiresAt &&
      now.getTime() < new Date(contact.otpExpiresAt).getTime() - 9 * 60 * 1000
    ) {
      const timeRemaining = Math.ceil(
        (new Date(contact.otpExpiresAt).getTime() -
          9 * 60 * 1000 -
          now.getTime()) /
          1000
      );
      throw new Error(
        `You can resend an OTP after ${timeRemaining} seconds. Please wait.`
      );
    }

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    // Create new OTP data
    // const otpData = createOtpData();

    let requestId: string | undefined;

    // send the OTP via email or phone
    try {
      if (validatedData.email && otpExpiresAt) {
        const response = await sendOtpEmail(
          contact.user.name,
          validatedData.email,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      } else if (validatedData.phone && otpExpiresAt) {
        const response = await sendOtpPhone(
          contact.user.name,
          validatedData.phone,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }

    // Update the OTP and expiration time in the database
    await tx.userContact.update({
      where: {
        value,
        type,
      },
      data: {
        otp: requestId,
        otpExpiresAt, // Set expiry 1 minute from now
      },
    });

    return {
      message: `Verification code sent to ${
        validatedData.email || validatedData.phone
      }.`,
      requestId,
    };
  });

  return result;
};

export const addUserContact = async (
  _: unknown,
  args: AddUserContactInput,
  context: any
) => {
  // const owner: any = verifyToken(validatedData.token);
  if (!context.owner?.userId || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Verify user exists and is not deleted
    const user = await tx.user.findFirst({
      where: {
        id: context.owner.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const validatedData = AddUserContactSchema.parse(args);

    if (!validatedData) return;

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
        userId: context.owner.userId,
        type,
        isVerified: true,
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
    // const otpData = createOtpData();

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Send OTP
    let requestId: string | undefined;
    try {
      if (validatedData.email && otpExpiresAt) {
        const response = await sendOtpEmail(
          user.name,
          validatedData.email,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      }
      if (validatedData.phone && otpExpiresAt) {
        const response = await sendOtpPhone(
          user.name,
          validatedData.phone,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      }
    } catch (error) {
      // Log error but don't fail the transaction
      console.error("Error sending OTP:", error);
    }

    await tx.userContact.create({
      data: {
        user: {
          connect: { id: context.owner.userId },
        },
        type,
        value: value!,
        otp: requestId,
        otpExpiresAt,
      },
    });

    return {
      value,
      message: `Verification code sent to ${value}`,
      requestId,
    };
  });
};

export const verifyUserContact = async (
  _: unknown,
  args: VerifyUserContactInput
) => {
  const validatedData = VerifyUserContactSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    // Verify contact
    const { requestId, isOTPVerified, message } = await verifyOtp(
      validatedData.requestId,
      validatedData.otp
    );

    if (!isOTPVerified) {
      throw new Error(message);
    }
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

    // if (!contact.otp || !contact.otpExpiresAt) {
    //   throw new Error("No verification code found. Please request a new one.");
    // }

    // if (contact.otpExpiresAt < new Date()) {
    //   throw new Error(
    //     "Verification code has expired. Please request a new one."
    //   );
    // }

    // if (contact.otp !== validatedData.otp) {
    //   throw new Error("Invalid verification code");
    // }

    // Verify the contact
    const verifiedContact = await tx.userContact.update({
      where: { value, deletedAt: null, otp: requestId },
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
            addresses: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    // Ensure there's a primary contact
    await ensurePrimaryContact(tx, verifiedContact.userId);
    const token = generateToken(verifiedContact.userId, "USER");

    return {
      ...verifiedContact,
      token,
      message: `${value} verified successfully!`,
      requestId,
    };
  });
};

export const userMe = async (_: unknown, args: unknown, context: any) => {
  if (!context.owner?.userId || typeof context.owner?.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: context.owner.userId,
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
        orderBy: [
          { isVerified: "desc" },
          { isPrimary: "desc" },
          { createdAt: "desc" },
        ],
      },
      addresses: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          deletedAt: true,
          updatedAt: true,
          business: {
            select: {
              id: true,
              slug: true,
              name: true,
              businessDetails: {
                select: {
                  logo: true,
                },
              },
            },
          },
        },
        take: 20,
      },
      feedbacks: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          user: true,
        },
        take: 20,
      },
      bookings: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      adminNotice: true,
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

  if (!validatedData) return;

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
      id: existingContact.userId,
      deletedAt: null,
    },
    include: {
      addresses: {
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

  if (user.isBlocked) {
    throw new Error("User is blocked!");
  }

  if (!user.salt || !user.password) {
    throw new Error("User signed in using other Authentication Methods!");
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

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.userContact.findFirst({
      where: {
        value,
        isVerified: true,
        deletedAt: null,
      },
      include: {
        user: true,
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

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    let requestId: string | undefined;
    // Send verification codes
    try {
      if (validatedData.email && otpExpiresAt) {
        const response = await sendOtpEmail(
          existingContact.user.name,
          validatedData.email,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      }
      if (validatedData.phone && otpExpiresAt) {
        const response = await sendOtpPhone(
          existingContact.user.name,
          validatedData.phone,
          OTP_EXPIRY_MINUTES
        );
        requestId = response.requestId;
      }
    } catch (error) {
      // Log error but don't fail the transaction
      console.error("Error sending OTP:", error);
    }

    // Create new contact
    // const otpData = createOtpData();
    await tx.userContact.update({
      where: {
        userId: existingContact.userId,
        type,
        value: value!,
      },
      data: {
        otp: requestId,
        otpExpiresAt,
      },
    });

    return {
      value: value,
      message: `Verification code sent to ${value}`,
      requestId,
    };
  });
};

export const changeUserPassword = async (
  _: unknown,
  args: ChangeUserPasswordInput
) => {
  const validatedData = ChangeUserPasswordSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    const { requestId, isOTPVerified, message } = await verifyOtp(
      validatedData.requestId,
      validatedData.otp
    );

    if (!isOTPVerified) {
      throw new Error(message);
    }
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.userContact.findFirst({
      where: {
        value,
        type,
        isVerified: true,
        deletedAt: null,
        otp: requestId,
      },
    });

    if (!existingContact) {
      throw new Error(
        `${
          validatedData.email ? validatedData.email : validatedData.phone
        } doesn't exit! OR ${requestId} is invalid`
      );
    }

    // if (!existingContact) {
    //   throw new Error("Contact not found");
    // }

    // if (!existingContact.otp || !existingContact.otpExpiresAt) {
    //   throw new Error("No verification code found. Please request a new one.");
    // }

    // if (existingContact.otpExpiresAt < new Date()) {
    //   throw new Error(
    //     "Verification code has expired. Please request a new one."
    //   );
    // }

    // if (existingContact.otp !== validatedData.otp) {
    //   throw new Error("Invalid verification code");
    // }

    const { salt, hash } = hashPassword(validatedData.password);

    const updatedPassword = await tx.user.update({
      where: {
        id: existingContact.userId,
        deletedAt: null,
      },
      data: {
        password: hash,
        salt,
        contacts: {
          update: {
            where: {
              id: existingContact.id,
            },
            data: {
              otp: null,
              otpExpiresAt: null,
            },
          },
        },
      },
    });

    return {
      ...updatedPassword,
      massage: "Password updated successfully.",
      requestId,
    };
  });
};

export const updateUserDetails = async (
  _: unknown,
  args: UpdateUserDetailsInput,
  context: any
) => {
  const validatedData = UpdateUserDetailsSchema.parse(args);

  if (!validatedData) return;

  if (!context.owner || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: context.owner.userId,
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

  let avatarUrl: string | undefined;

  // Handle avatar upload if provided
  if (validatedData.avatar) {
    avatarUrl = await uploadToSpaces(
      validatedData.avatar,
      "avatars",
      user.avatar
    );
  }

  let name;

  if (validatedData && validatedData.name !== user.name) {
    name = validatedData.name;
  }

  // if (validatedData.slug) {
  //   const existingSlug = await prisma.user.findFirst({
  //     where: { slug: validatedData.slug },
  //   });
  //   if (existingSlug) throw new Error("Slug already exists.");
  // }

  let slug = undefined;

  const initialSlug = validatedData.slug || name;

  if (initialSlug) {
    slug = slugify(initialSlug, { lower: true, strict: true });
    let uniqueSuffixLength = 2;
    let existingSlug = await prisma.user.findFirst({ where: { slug } });

    while (existingSlug) {
      const uniqueSuffix = Math.random()
        .toString(16)
        .slice(2, 2 + uniqueSuffixLength);
      slug = `${slugify(initialSlug, {
        lower: true,
        strict: true,
      })}-${uniqueSuffix}`;
      existingSlug = await prisma.user.findFirst({ where: { slug } });
      uniqueSuffixLength += 1;
    }
  }

  // Update user name and phone
  const updatedUser = await prisma.user.update({
    where: { id: user.id, deletedAt: null },
    data: {
      name: name,
      slug: slug,
      avatar: avatarUrl,
      hideDetails: validatedData.hideDetails,
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
      addresses: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 20,
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
  args: unknown,
  context: any
) => {
  if (!context.owner?.userId || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Check if user exists
    const user = await tx.user.findFirst({
      where: {
        id: context.owner.userId,
        deletedAt: null,
      },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Soft delete user contacts
    await tx.userContact.updateMany({
      where: {
        userId: context.owner.userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isVerified: false,
        isPrimary: false,
      },
    });

    // Soft delete user address if exists
    if (user.addresses) {
      await tx.userAddress.updateMany({
        where: {
          userId: context.owner.userId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Soft delete the user
    const deletedUser = await tx.user.update({
      where: {
        id: context.owner.userId,
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

export const manageUserAddress = async (
  _: unknown,
  args: ManageUserAddressInput,
  context: any
) => {
  if (!context.owner || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the user, ensuring they have a verified contact
  const user = await prisma.user.findUnique({
    where: {
      id: context.owner.userId,
      deletedAt: null,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      addresses: {
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

  // Validate input data using Zod
  const validatedData = ManageUserAddressSchema.parse(args);

  if (!validatedData?.addresses) return;

  const updatedAddresses = [];

  for (const addressData of validatedData.addresses) {
    const existingAddress = addressData.addressId
      ? user.addresses.find((address) => address.id === addressData.addressId)
      : null;

    if (addressData.toDelete) {
      // If toDelete is true, delete the address
      if (existingAddress) {
        await prisma.userAddress.delete({
          where: { id: existingAddress.id },
        });

        updatedAddresses.push({
          message: `User address with id ${existingAddress.id} deleted successfully.`,
        });
      } else {
        updatedAddresses.push({
          message: "Address not found to delete.",
        });
      }
    } else if (existingAddress) {
      // If the address exists and toDelete is not true, update it
      const updatedAddress = await prisma.userAddress.update({
        where: { id: existingAddress.id },
        data: {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          country: addressData.country,
          pincode: addressData.pincode,
        },
      });

      updatedAddresses.push({
        ...updatedAddress,
        message: "User address updated successfully.",
      });
    } else {
      // If the address does not exist, create a new one
      const newAddress = await prisma.userAddress.create({
        data: {
          street: addressData.street!,
          city: addressData.city!,
          state: addressData.state!,
          country: addressData.country!,
          pincode: addressData.pincode!,
          user: {
            connect: { id: user.id },
          },
        },
      });

      updatedAddresses.push({
        ...newAddress,
        message: "User address added successfully.",
      });
    }
  }
  return updatedAddresses;
};

export const getUserAdminNotices = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner?.userId || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: context.owner.userId,
      deletedAt: null,
      isBlocked: false,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      adminNotice: true,
    },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const result = [];

  result.push(user.adminNotice);

  const allUserNotice = await prisma.adminNotice.findMany({
    where: {
      deletedAt: null,
      type: "ALL_USER",
    },
  });

  result.push(...allUserNotice);

  return result;
};

export const userSubscription = async (
  _: unknown,
  args: UserSubscriptionInput,
  context: any
) => {
  if (!context.owner.userId || typeof context.owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: context.owner.userId,
      deletedAt: null,
      isBlocked: false,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  const validatedData = UserSubscriptionSchema.parse(args);

  if (!validatedData) return;

  const plan = await prisma.userSubscription.findFirst({
    where: {
      id: validatedData.subscriptionId,
      deletedAt: null,
    },
  });

  if (!plan?.price || !plan?.duration) {
    throw new Error("Invalid Plan");
  }

  const order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: "INR",
    receipt: user.id,
  });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      subscriptionId: plan.id,
      razorpay_order_id: order.id,
    },
  });

  return {
    ...order,
  };
};

export const userVerifyPayment = async (
  _: unknown,
  args: UserVerifyPaymentInput
) => {
  const validatedData = UserVerifyPaymentSchema.parse(args);

  if (!validatedData) return;

  const body = `${validatedData.razorpay_order_id}|${validatedData.razorpay_payment_id}`;

  const generatedSignature = createHmac(
    "sha256",
    process.env.RAZORPAY_API_SECRETS!
  )
    .update(body.toString())
    .digest("hex");

  if (generatedSignature !== validatedData.razorpay_signature) {
    throw new Error("Incorrect razorpay signature. Validation failed!");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      razorpay_order_id: validatedData.razorpay_order_id,
      deletedAt: null,
      contacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  const subscriptionExpire = new Date();
  subscriptionExpire.setDate(
    subscriptionExpire.getDate() + user.subscription!.duration
  );

  const verifiedUserPayment = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      paymentVerification: true,
      subscriptionExpire: subscriptionExpire,
    },
  });

  return {
    ...verifiedUserPayment,
    message: "Payment Verified!",
  };
};
