import {
  ChangeBusinessPasswordInput,
  ChangeBusinessPasswordSchema,
  ForgetBusinessPasswordInput,
  ForgetBusinessPasswordSchema,
  BusinessLoginInput,
  BusinessLoginSchema,
  BusinessSignupInput,
  BusinessSignupSchema,
  UpdateBusinessDetailsInput,
  UpdateBusinessDetailsSchema,
  ManageBusinessAddressInput,
  ManageBusinessAddressSchema,
  VerifyBusinessPrimaryContactInput,
  VerifyBusinessPrimaryContactSchema,
  ManageBusinessWebsiteInput,
  ManageBusinessWebsiteSchema,
  AddBusinessPrimaryContactInput,
  AddBusinessPrimaryContactSchema,
  ManageBusinessSupportingDocumentsInput,
  ManageBusinessSupportingDocumentsSchema,
  ManageBusinessCoverImageInput,
  ManageBusinessCoverImageSchema,
  ManageBusinessAdBannerImageInput,
  ManageBusinessAdBannerImageSchema,
  ManageBusinessMobileAdBannerImageInput,
  ManageBusinessMobileAdBannerImageSchema,
  ManageBusinessOperatingHoursInput,
  ManageBusinessOperatingHoursSchema,
  ResendBusinessOtpInput,
  ResendBusinessOtpSchema,
  // BusinessVerifyPaymentInput,
  // BusinessVerifyPaymentSchema,
  // BusinessSubscriptionInput,
  // BusinessSubscriptionSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
// import { sendOtpEmail } from "../../../utils/emailService";
import { generateToken } from "../../../utils/token";
import slugify from "slugify";
// import { sendOtpPhone } from "../../../utils/smsService";
import { createOtpData } from "../../../utils/generateOtp";
// import crypto from "crypto";
import { ContactType, Prisma } from "@prisma/client";
import { deleteFromSpaces, uploadToSpaces } from "../../../utils/bucket";

// import { razorpay } from "../../../utils/razorpay";

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
  businessId: string
): Promise<void> => {
  const hasAnyPrimary = await tx.businessPrimaryContact.findFirst({
    where: {
      businessId,
      isPrimary: true,
      isVerified: true,
      deletedAt: null,
    },
  });

  if (!hasAnyPrimary) {
    const mostRecentVerified = await tx.businessPrimaryContact.findFirst({
      where: {
        businessId,
        isVerified: true,
        deletedAt: null,
      },
      orderBy: { verifiedAt: "desc" },
    });

    if (mostRecentVerified) {
      await tx.businessPrimaryContact.update({
        where: { id: mostRecentVerified.id },
        data: { isPrimary: true },
      });
    }
  }
};

const cleanupUnverifiedContacts = async (
  tx: Prisma.TransactionClient,
  value: string,
  type: ContactType
): Promise<void> => {
  await tx.businessPrimaryContact.deleteMany({
    where: {
      value,
      type,
      isVerified: false,
      OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
    },
  });
};

const checkVerificationAttempts = async (
  tx: Prisma.TransactionClient,
  contactValue: string,
  type: ContactType
): Promise<void> => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const attempts = await tx.businessPrimaryContact.count({
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

export const businessMe = async (_: unknown, args: unknown, context: any) => {
  if (
    !context.owner.businessId ||
    typeof context.owner.businessId !== "string"
  ) {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findFirst({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      primaryContacts: true,
      businessDetails: {
        include: {
          categories: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          operatingHours: {
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
              order: "asc",
            },
          },
          websites: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          courts: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          proficiencies: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          languages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          tags: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      businessSupportingDocuments: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
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
          user: {
            select: {
              id: true,
              slug: true,
              name: true,
              avatar: true,
            },
          },
        },
      },

      feedbacks: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          business: true,
        },
      },
      subscription: {
        where: {
          deletedAt: null,
        },
      },
      bookings: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      adminNotice: true,
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  return business;
};

export const businessSignup = async (_: unknown, args: BusinessSignupInput) => {
  const validatedData = BusinessSignupSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    let contactConditions: Prisma.BusinessPrimaryContactWhereInput;

    if (validatedData.email) {
      contactConditions = {
        value: validatedData.email,
        type: "EMAIL",
        isVerified: true,
        deletedAt: null,
      };
    } else {
      contactConditions = {
        value: validatedData.phone,
        type: "PHONE",
        isVerified: true,
        deletedAt: null,
      };
    }

    const existingContact = await tx.businessPrimaryContact.findFirst({
      where: contactConditions,
    });

    if (existingContact) {
      throw new Error(
        `A verified business with this ${existingContact.type.toLowerCase()} already exists!`
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

    const business = await tx.business.create({
      data: {},
    });

    // Create contacts
    if (validatedData.email) {
      await tx.businessPrimaryContact.create({
        data: {
          business: {
            connect: { id: business.id },
          },
          type: "EMAIL",
          value: validatedData.email,
          isPrimary: true,
          otp: emailOtpData?.otp,
          otpExpiresAt: emailOtpData?.otpExpiresAt,
        },
      });
    }

    if (validatedData.phone) {
      await tx.businessPrimaryContact.create({
        data: {
          businessId: business.id,
          type: "PHONE",
          value: validatedData.phone,
          isPrimary: !validatedData.email,
          otp: phoneOtpData?.otp,
          otpExpiresAt: phoneOtpData?.otpExpiresAt,
        },
      });
    }

    // // Send verification codes
    // try {
    //   if (validatedData.email && emailOtpData) {
    //     await sendOtpEmail(null, validatedData.email, emailOtpData.otp);
    //   }
    //   if (validatedData.phone && phoneOtpData) {
    //     await sendOtpPhone(null, validatedData.phone, phoneOtpData.otp);
    //   }
    // } catch (error) {
    //   // Log error but don't fail the transaction
    //   console.error("Error sending OTP:", error);
    // }

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

export const resendBusinessOtp = async (
  _: unknown,
  args: ResendBusinessOtpInput
) => {
  const validatedData = ResendBusinessOtpSchema.parse(args);

  if (!validatedData) return;

  const type = validatedData.email ? "EMAIL" : "PHONE";
  const value = validatedData.email || validatedData.phone;

  if (!value) return;

  const now = new Date();

  // Start a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Retrieve the business's current OTP details
    const contact = await tx.businessPrimaryContact.findUnique({
      where: { value },
      select: { otpExpiresAt: true },
    });

    // Use the checkVerificationAttempts function to check the attempts
    await checkVerificationAttempts(tx, value, type);

    // Check if the business is allowed to resend an OTP
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

    // Create new OTP data
    const otpData = createOtpData();

    // Update the OTP and expiration time in the database
    await tx.businessPrimaryContact.update({
      where: {
        value,
        type,
      },
      data: {
        otp: otpData?.otp,
        otpExpiresAt: otpData?.otpExpiresAt, // Set expiry 1 minute from now
      },
    });

    // Optionally, send the OTP via email or phone
    // try {
    //   if (validatedData.email && otpData) {
    //     await sendOtpEmail(null, validatedData.email, otpData.otp);
    //   } else if (validatedData.phone && otpData) {
    //     await sendOtpPhone(null, validatedData.phone, otpData.otp);
    //   }
    // } catch (error) {
    //   console.error("Error sending OTP:", error);
    // }

    return {
      message: `Verification code sent to your ${
        validatedData.email && validatedData.phone
          ? "email and phone"
          : validatedData.email
          ? "email"
          : "phone"
      }.`,
    };
  });

  return result;
};

export const verifyBusinessPrimaryContact = async (
  _: unknown,
  args: VerifyBusinessPrimaryContactInput
) => {
  const validatedData = VerifyBusinessPrimaryContactSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const contact = await tx.businessPrimaryContact.findFirst({
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

    const business = await tx.business.findUnique({
      where: { id: contact.businessId },
    });

    let passwordUpdate = {};
    if (!business?.password && validatedData.password) {
      const { salt, hash } = hashPassword(validatedData.password);
      passwordUpdate = { password: hash, salt };
    }

    // Verify the contact
    const verifiedContact = await tx.businessPrimaryContact.update({
      where: { id: contact.id, value },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        otp: null,
        otpExpiresAt: null,
        business: {
          update: {
            ...passwordUpdate,
            type: "FIRM",
            slug: business?.slug ? undefined : business?.id,
          },
        },
      },
      include: {
        business: {
          include: {
            primaryContacts: true,
            businessDetails: {
              include: {
                addresses: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                websites: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                coverImages: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                adBannerImages: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                mobileAdBannerImages: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                courts: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                proficiencies: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
                tags: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
              },
            },
            businessSupportingDocuments: {
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
                createdAt: "desc",
              },
            },
            subscription: {
              where: {
                deletedAt: null,
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
        },
      },
    });

    // Ensure there's a primary contact
    await ensurePrimaryContact(tx, contact.businessId);
    const token = generateToken(verifiedContact.businessId, "BUSINESS");

    return {
      ...verifiedContact,
      token,
      message: `${type === "EMAIL" ? "Email" : "Phone"} verified successfully!`,
    };
  });
};

export const businessLogin = async (_: unknown, args: BusinessLoginInput) => {
  const validatedData = BusinessLoginSchema.parse(args);

  if (!validatedData) return;

  const value = validatedData.email || validatedData.phone;

  const existingContact = await prisma.businessPrimaryContact.findFirst({
    where: {
      value,
      isVerified: true,
      deletedAt: null,
    },
  });
  if (!existingContact) {
    throw new Error(`Wrong email or password!`);
  }

  const business = await prisma.business.findFirst({
    where: {
      id: existingContact.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      primaryContacts: true,
      businessDetails: {
        include: {
          addresses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          websites: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          courts: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          proficiencies: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          tags: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      businessSupportingDocuments: {
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
          createdAt: "desc",
        },
      },
      subscription: {
        where: {
          deletedAt: null,
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

  if (!business) {
    throw new Error("Wrong email or password!");
  }

  const verify = verifyPassword(
    validatedData.password,
    business.salt!,
    business.password!
  );

  if (verify) {
    const token = generateToken(business.id, "BUSINESS");

    return {
      ...business,
      message: "Logged in successful.",
      token: token,
    };
  } else {
    throw new Error("Wrong email or password!");
  }
};

export const addBusinessPrimaryContact = async (
  _: unknown,
  args: AddBusinessPrimaryContactInput,
  context: any
) => {
  if (
    !context.owner?.businessId ||
    typeof context.owner.businessId !== "string"
  ) {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Verify business exists and is not deleted
    const business = await tx.business.findFirst({
      where: {
        id: context.owner.businessId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    const validatedData = AddBusinessPrimaryContactSchema.parse(args);

    if (!validatedData) return;

    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    // Check for existing contact
    const existingContact = await tx.businessPrimaryContact.findFirst({
      where: {
        value,
        type,
        isVerified: true,
        deletedAt: null,
      },
    });

    if (existingContact) {
      throw new Error(
        `This ${type.toLowerCase()} is already registered and verified by a business!`
      );
    }

    cleanupUnverifiedContacts(tx, value!, type);

    // Check contact limit for the current business
    const existingContactsCount = await tx.businessPrimaryContact.count({
      where: {
        businessId: context.owner.businessId,
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
    const newContact = await tx.businessPrimaryContact.create({
      data: {
        business: {
          connect: { id: context.owner.businessId },
        },
        type,
        value: value!,
        ...otpData,
      },
      include: {
        business: true,
      },
    });

    console.log(!newContact);

    // Send OTP
    // try {
    //   if (type === "EMAIL") {
    //     await sendOtpEmail(newContact.business.name, value!, otpData.otp);
    //   } else {
    //     await sendOtpPhone(newContact.business.name, value!, otpData.otp);
    //   }
    // } catch (error) {
    //   console.error("Error sending OTP:", error);
    //   // Delete the contact if OTP sending fails
    //   await tx.businessPrimaryContact.delete({
    //     where: { id: newContact.id },
    //   });
    //   throw new Error(
    //     `Failed to send verification code to ${type.toLowerCase()}`
    //   );
    // }

    return {
      value,
      message: `Verification code sent to your ${type.toLowerCase()}`,
    };
  });
};

export const forgetBusinessPassword = async (
  _: unknown,
  args: ForgetBusinessPasswordInput
) => {
  const validatedData = ForgetBusinessPasswordSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.businessPrimaryContact.findFirst({
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
    const updatedContact = await tx.businessPrimaryContact.update({
      where: {
        businessId: existingContact.businessId,
        type,
        value: value!,
      },
      data: {
        ...otpData,
      },
      include: {
        business: true,
      },
    });

    console.log(!updatedContact);
    // Send OTP
    // try {
    //   if (type === "EMAIL") {
    //     await sendOtpEmail(newContact.business.name, value!, otpData.otp);
    //   } else {
    //     await sendOtpPhone(newContact.business.name, value!, otpData.otp);
    //   }
    // } catch (error) {
    //   console.error("Error sending OTP:", error);
    //   // Delete the contact if OTP sending fails
    //   await tx.businessPrimaryContact.delete({
    //     where: { id: newContact.id },
    //   });
    //   throw new Error(
    //     `Failed to send verification code to ${type.toLowerCase()}`
    //   );
    // }
    return {
      value: value,
      message: `Verification code sent to your ${type.toLowerCase()}`,
    };
  });
};

export const changeBusinessPassword = async (
  _: unknown,
  args: ChangeBusinessPasswordInput
) => {
  const validatedData = ChangeBusinessPasswordSchema.parse(args);

  if (!validatedData) return;

  return await prisma.$transaction(async (tx) => {
    const value = validatedData.email || validatedData.phone;
    const type = validatedData.email ? "EMAIL" : "PHONE";

    const existingContact = await tx.businessPrimaryContact.findFirst({
      where: {
        value,
        type,
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

    const updatedPassword = await tx.business.update({
      where: {
        id: existingContact.businessId,
        deletedAt: null,
      },
      data: {
        password: hash,
        salt,
        primaryContacts: {
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
      include: {
        primaryContacts: true,
        businessDetails: {
          include: {
            addresses: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            websites: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            coverImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            adBannerImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            mobileAdBannerImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            courts: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            proficiencies: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            tags: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
        businessSupportingDocuments: {
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
            createdAt: "desc",
          },
        },
        subscription: {
          where: {
            deletedAt: null,
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
      ...updatedPassword,
      massage: "Password updated successfully.",
    };
  });
};

export const updateBusinessDetails = async (
  _: unknown,
  args: UpdateBusinessDetailsInput,
  context: any
) => {
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findFirst({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: true,
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const validatedData = UpdateBusinessDetailsSchema.parse(args);

  if (!validatedData) return;

  let name;

  if (validatedData && validatedData.name !== business.name) {
    name = validatedData.name;
  }

  // if (validatedData.slug) {
  //   const existingSlug = await prisma.business.findFirst({
  //     where: { slug: validatedData.slug },
  //   });
  //   if (existingSlug) throw new Error("Slug already exists.");
  // }

  let slug = undefined;

  const initialSlug = validatedData.slug || name;

  if (initialSlug) {
    slug = slugify(initialSlug, { lower: true, strict: true });
    let uniqueSuffixLength = 2;
    let existingSlug = await prisma.business.findFirst({ where: { slug } });

    while (existingSlug) {
      const uniqueSuffix = Math.random()
        .toString(16)
        .slice(2, 2 + uniqueSuffixLength);
      slug = `${slugify(initialSlug, {
        lower: true,
        strict: true,
      })}-${uniqueSuffix}`;
      existingSlug = await prisma.business.findFirst({ where: { slug } });
      uniqueSuffixLength += 1;
    }
  }
  // Handle logo update if provided
  if (validatedData.logo) {
    const logoUrl = await uploadToSpaces(
      validatedData.logo,
      "business_logos",
      business.businessDetails?.logo
    );
    await prisma.businessDetails.update({
      where: { id: business.id },
      data: {
        logo: logoUrl,
      },
    });
  }

  const updatedBusinessDetails = await prisma.businessDetails.upsert({
    where: { id: business.id },
    update: {
      registrationNumber: validatedData.registrationNumber,
      license: validatedData.license,
      experience: validatedData.experience,
      teamSize: validatedData.teamSize,
      description: validatedData.description,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      gstNumber: validatedData.gstNumber,
      primaryWebsite: validatedData.primaryWebsite,
      degrees: validatedData.degrees,
      categories: validatedData.categoryIds
        ? {
            set: [], // Clear all existing categories only when data is provided
            connect: validatedData.categoryIds
              .filter((categoryId): categoryId is string => !!categoryId) // Ensure no undefined values
              .map((categoryId) => ({ id: categoryId })),
          }
        : undefined, // Do nothing if no new data is provided
      languages: validatedData.languages?.length
        ? {
            set: [], // Clear all existing languages when new data is provided
            connectOrCreate: validatedData.languages.map(
              (language: string) => ({
                where: { name: language },
                create: { name: language },
              })
            ),
          }
        : undefined, // Do nothing if no new data is provided,

      proficiencies: validatedData.proficiencies?.length
        ? {
            set: [], // Clear existing proficiencies
            connectOrCreate: validatedData.proficiencies.map(
              (proficiency: string) => ({
                where: { name: proficiency },
                create: { name: proficiency },
              })
            ),
          }
        : undefined,

      courts: validatedData.courts?.length
        ? {
            set: [], // Clear existing courts
            connectOrCreate: validatedData.courts.map((court: string) => ({
              where: { name: court },
              create: { name: court },
            })),
          }
        : undefined,

      tags: validatedData.tags?.length
        ? {
            set: [], // Clear existing tags
            connectOrCreate: validatedData.tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          }
        : undefined,
    },
    create: {
      business: { connect: { id: business.id } },
      registrationNumber: validatedData.registrationNumber,
      license: validatedData.license,
      experience: validatedData.experience,
      teamSize: validatedData.teamSize,
      description: validatedData.description,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      gstNumber: validatedData.gstNumber,
      degrees: validatedData.degrees,
      primaryWebsite: validatedData.primaryWebsite,
      categories: validatedData.categoryIds
        ? {
            connect: validatedData.categoryIds
              .filter((categoryId): categoryId is string => !!categoryId) // Ensure no undefined values
              .map((categoryId) => ({ id: categoryId })),
          }
        : undefined, // Do nothing if no new data is provided
      languages: validatedData.languages?.length
        ? {
            connectOrCreate: validatedData.languages.map(
              (language: string) => ({
                where: { name: language },
                create: { name: language },
              })
            ),
          }
        : undefined, // Do nothing if no new data is provided,

      proficiencies: validatedData.proficiencies?.length
        ? {
            connectOrCreate: validatedData.proficiencies.map(
              (proficiency: string) => ({
                where: { name: proficiency },
                create: { name: proficiency },
              })
            ),
          }
        : undefined,

      courts: validatedData.courts?.length
        ? {
            connectOrCreate: validatedData.courts.map((court: string) => ({
              where: { name: court },
              create: { name: court },
            })),
          }
        : undefined,

      tags: validatedData.tags?.length
        ? {
            connectOrCreate: validatedData.tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          }
        : undefined,
    },
  });

  // Update business details
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id, deletedAt: null },
    data: {
      name: name,
      slug: slug,
      isListed: validatedData.isListed,
      additionalContacts: validatedData.additionalContacts,
      businessDetails: { connect: { id: updatedBusinessDetails.id } },
    },
    include: {
      primaryContacts: true,
      businessDetails: {
        include: {
          categories: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
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
          websites: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          courts: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          proficiencies: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          tags: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      businessSupportingDocuments: {
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
          createdAt: "desc",
        },
      },
      subscription: {
        where: {
          deletedAt: null,
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
    ...updatedBusiness,
    message: "Business details updated successfully.",
  };
};

export const deleteBusinessAccount = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (
    !context.owner.businessId ||
    typeof context.owner.businessId !== "string"
  ) {
    throw new Error("Invalid or missing token");
  }

  return await prisma.$transaction(async (tx) => {
    // Check if business exists
    const business = await tx.business.findFirst({
      where: {
        id: context.owner.businessId,
        deletedAt: null,
      },
      include: {
        primaryContacts: true,
        businessDetails: {
          include: {
            websites: true,
            coverImages: true,
            adBannerImages: true,
            mobileAdBannerImages: true,
            addresses: true,
          },
        },
      },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    // Soft delete business contacts
    await tx.businessPrimaryContact.updateMany({
      where: {
        businessId: context.owner.businessId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isVerified: false,
        isPrimary: false,
      },
    });

    // Soft delete business address if exists
    if (business.businessDetails?.addresses) {
      await tx.businessAddress.updateMany({
        where: {
          businessDetailsId: context.owner.businessId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    if (business.businessDetails?.websites) {
      await tx.businessWebsite.updateMany({
        where: {
          businessDetailsId: context.owner.businessId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    if (business.businessDetails?.coverImages) {
      await tx.businessCoverImage.updateMany({
        where: {
          businessDetailsId: context.owner.businessId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Soft delete the business
    const deletedBusiness = await tx.business.update({
      where: {
        id: context.owner.businessId,
      },
      data: {
        deletedAt: new Date(),
      },
      include: {
        primaryContacts: true,
        businessDetails: {
          include: {
            addresses: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            websites: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            coverImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
        businessSupportingDocuments: {
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
            createdAt: "desc",
          },
        },
        subscription: {
          where: {
            deletedAt: null,
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
      ...deletedBusiness,
      message: "Account deleted successfully",
    };
  });
};

export const manageBusinessAddress = async (
  _: unknown,
  args: ManageBusinessAddressInput,
  context: any
) => {
  // Verify the token and get the business ID

  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          addresses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const updatedAddresses = [];

  // Validate input data using Zod
  const validatedData = ManageBusinessAddressSchema.parse(args);

  if (!validatedData?.addresses) return;

  for (const addressData of validatedData.addresses) {
    const existingAddress = addressData.addressId
      ? business.businessDetails?.addresses.find(
          (address) => address.id === addressData.addressId
        )
      : null;

    if (addressData.toDelete) {
      // If toDelete is true, delete the address
      if (existingAddress) {
        await prisma.businessAddress.delete({
          where: { id: existingAddress.id },
        });

        updatedAddresses.push({
          message: `Business address with id ${existingAddress.id} deleted successfully.`,
        });
      } else {
        updatedAddresses.push({
          message: "Address not found to delete.",
        });
      }
    } else if (existingAddress) {
      // If the address exists and toDelete is not true, update it
      const updatedAddress = await prisma.businessAddress.update({
        where: { id: existingAddress.id },
        data: {
          order: addressData.order,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          country: addressData.country,
          pincode: addressData.pincode,
        },
      });

      updatedAddresses.push({
        ...updatedAddress,
        message: "Business address updated successfully.",
      });
    } else {
      // If the address does not exist, create a new one
      const newAddress = await prisma.businessAddress.create({
        data: {
          order: addressData.order!,
          street: addressData.street!,
          city: addressData.city!,
          state: addressData.state!,
          country: addressData.country!,
          pincode: addressData.pincode!,
          businessDetails: {
            connect: { id: business.id },
          },
        },
      });

      updatedAddresses.push({
        ...newAddress,
        message: "Business address added successfully.",
      });
    }
  }
  return updatedAddresses;
};

export const manageBusinessWebsite = async (
  _: unknown,
  args: ManageBusinessWebsiteInput,
  context: any
) => {
  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          websites: {
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

  if (!business) {
    throw new Error("Business not found!");
  }

  const updatedWebsites = [];

  // Validate input data using Zod
  const validatedData = ManageBusinessWebsiteSchema.parse(args);

  if (!validatedData?.websites) return;

  for (const websiteData of validatedData.websites) {
    const existingWebsite = websiteData.websiteId
      ? business.businessDetails?.websites.find(
          (website) => website.id === websiteData.websiteId
        )
      : null;

    if (websiteData.toDelete) {
      // If toDelete is true, delete the address
      if (existingWebsite) {
        await prisma.businessWebsite.delete({
          where: { id: existingWebsite.id },
        });

        updatedWebsites.push({
          message: `Business address with id ${existingWebsite.id} deleted successfully.`,
        });
      } else {
        updatedWebsites.push({
          message: "Address not found to delete.",
        });
      }
    } else if (existingWebsite) {
      // If the address exists and toDelete is not true, update it
      const updatedWebsite = await prisma.businessWebsite.update({
        where: { id: existingWebsite.id },
        data: {
          url: websiteData.url,
          type: websiteData.type,
        },
      });

      updatedWebsites.push({
        ...updatedWebsite,
        message: "Business address updated successfully.",
      });
    } else {
      // If the address does not exist, create a new one
      const newWebsite = await prisma.businessWebsite.create({
        data: {
          url: websiteData.url!,
          type: websiteData.type!,
          businessDetails: {
            connect: { id: business.id },
          },
        },
      });

      updatedWebsites.push({
        ...newWebsite,
        message: "Business address added successfully.",
      });
    }
  }
  return updatedWebsites;
};

export const manageBusinessCoverImage = async (
  _: unknown,
  args: ManageBusinessCoverImageInput,
  context: any
) => {
  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const updateResults = [];

  // Validate input data using Zod
  const validatedData = ManageBusinessCoverImageSchema.parse(args);

  if (!validatedData?.coverImages) return;

  for (const imageData of validatedData.coverImages) {
    const existingImage = imageData.imageId
      ? business.businessDetails?.coverImages.find(
          (image) => image.id === imageData.imageId
        )
      : null;

    if (imageData.toDelete) {
      // If toDelete is true, delete the image
      if (existingImage) {
        await deleteFromSpaces(existingImage.url);
        await prisma.businessCoverImage.delete({
          where: { id: existingImage.id },
        });

        updateResults.push({
          message: `Business image with id ${existingImage.id} deleted successfully.`,
        });
      } else {
        updateResults.push({
          message: "Image not found to delete.",
        });
      }
    } else if (existingImage) {
      const updatedUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        existingImage.url
      );
      // If the image exists and toDelete is not true, update it
      const updatedImage = await prisma.businessCoverImage.update({
        where: { id: existingImage.id },
        data: {
          url: updatedUrl,
          order: imageData.order,
        },
      });

      updateResults.push({
        ...updatedImage,
        message: "Business image updated successfully.",
      });
    } else {
      const newImageUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        null
      );
      // If the address does not exist, create a new one
      const newImage = await prisma.businessCoverImage.create({
        data: {
          url: newImageUrl,
          order: imageData.order,
          businessDetails: {
            connect: { id: business.id },
          },
        },
      });

      updateResults.push({
        ...newImage,
        message: "Business image added successfully.",
      });
    }
  }
  return updateResults;
};

export const manageBusinessAdBannerImage = async (
  _: unknown,
  args: ManageBusinessAdBannerImageInput,
  context: any
) => {
  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  // Validate input data using Zod
  const validatedData = ManageBusinessAdBannerImageSchema.parse(args);

  if (!validatedData?.adBannerImages) return;

  const updateResults = [];

  for (const imageData of validatedData.adBannerImages) {
    const existingImage = imageData.imageId
      ? business.businessDetails?.adBannerImages.find(
          (image) => image.id === imageData.imageId
        )
      : null;

    if (imageData.toDelete) {
      // If toDelete is true, delete the image
      if (existingImage) {
        await deleteFromSpaces(existingImage.url);
        await prisma.businessAdBannerImage.delete({
          where: { id: existingImage.id },
        });

        updateResults.push({
          message: `Business image with id ${existingImage.id} deleted successfully.`,
        });
      } else {
        updateResults.push({
          message: "Image not found to delete.",
        });
      }
    } else if (existingImage) {
      const updatedUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        existingImage.url
      );
      // If the image exists and toDelete is not true, update it
      const updatedImage = await prisma.businessAdBannerImage.update({
        where: { id: existingImage.id },
        data: {
          url: updatedUrl,
          order: imageData.order,
        },
      });

      updateResults.push({
        ...updatedImage,
        message: "Business image updated successfully.",
      });
    } else {
      const newImageUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        null
      );
      // If the address does not exist, create a new one
      const newImage = await prisma.businessAdBannerImage.create({
        data: {
          url: newImageUrl,
          order: imageData.order,
          businessDetails: {
            connect: { id: business.id },
          },
        },
      });

      updateResults.push({
        ...newImage,
        message: "Business image added successfully.",
      });
    }
  }
  return updateResults;
};

export const manageBusinessMobileAdBannerImage = async (
  _: unknown,
  args: ManageBusinessMobileAdBannerImageInput,
  context: any
) => {
  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  // Validate input data using Zod

  const validatedData = ManageBusinessMobileAdBannerImageSchema.parse(args);

  if (!validatedData?.mobileAdBannerImages) return;

  const updateResults = [];

  for (const imageData of validatedData.mobileAdBannerImages) {
    const existingImage = imageData.imageId
      ? business.businessDetails?.mobileAdBannerImages.find(
          (image) => image.id === imageData.imageId
        )
      : null;

    if (imageData.toDelete) {
      // If toDelete is true, delete the image
      if (existingImage) {
        await deleteFromSpaces(existingImage.url);
        await prisma.businessMobileAdBannerImage.delete({
          where: { id: existingImage.id },
        });

        updateResults.push({
          message: `Business image with id ${existingImage.id} deleted successfully.`,
        });
      } else {
        updateResults.push({
          message: "Image not found to delete.",
        });
      }
    } else if (existingImage) {
      const updatedUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        existingImage.url
      );
      // If the image exists and toDelete is not true, update it
      const updatedImage = await prisma.businessMobileAdBannerImage.update({
        where: { id: existingImage.id },
        data: {
          url: updatedUrl,
          order: imageData.order,
        },
      });

      updateResults.push({
        ...updatedImage,
        message: "Business image updated successfully.",
      });
    } else {
      const newImageUrl = await uploadToSpaces(
        imageData.image,
        "business_images",
        null
      );
      // If the address does not exist, create a new one
      const newImage = await prisma.businessMobileAdBannerImage.create({
        data: {
          url: newImageUrl,
          order: imageData.order,
          businessDetails: {
            connect: { id: business.id },
          },
        },
      });

      updateResults.push({
        ...newImage,
        message: "Business image added successfully.",
      });
    }
  }
  return updateResults;
};

export const manageBusinessSupportingDocuments = async (
  _: unknown,
  args: ManageBusinessSupportingDocumentsInput,
  context: any
) => {
  // Validate input data using Zod
  const validatedData = ManageBusinessSupportingDocumentsSchema.parse(args);

  if (!validatedData?.documents) return;

  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessSupportingDocuments: true,
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const updateResults = [];

  for (const documentData of validatedData.documents) {
    const existingDocument = documentData.documentId
      ? business.businessSupportingDocuments.find(
          (document) => document.id === documentData.documentId
        )
      : null;

    if (documentData.toDelete) {
      // If toDelete is true, delete the image
      if (existingDocument) {
        await deleteFromSpaces(existingDocument.url);
        await prisma.businessSupportingDocuments.delete({
          where: { id: existingDocument.id },
        });

        updateResults.push({
          message: `Business supporting document with id ${existingDocument.id} deleted successfully.`,
        });
      } else {
        updateResults.push({
          message: "Document not found to delete.",
        });
      }
    } else if (existingDocument) {
      const updatedUrl = await uploadToSpaces(
        documentData.document,
        "business_supporting_documents",
        existingDocument.url
      );
      // If the image exists and toDelete is not true, update it
      const updatedDocument = await prisma.businessSupportingDocuments.update({
        where: { id: existingDocument.id },
        data: {
          url: updatedUrl,
          type: documentData.type,
        },
      });

      updateResults.push({
        ...updatedDocument,
        message: "Business supporting document updated successfully.",
      });
    } else {
      const newDocumentUrl = await uploadToSpaces(
        documentData.document,
        "business_supporting_documents",
        null
      );
      // If the address does not exist, create a new one
      const newDocument = await prisma.businessSupportingDocuments.create({
        data: {
          url: newDocumentUrl,
          type: documentData.type!,
          business: {
            connect: { id: business.id },
          },
        },
      });

      updateResults.push({
        ...newDocument,
        message: "Business supporting document added successfully.",
      });
    }
  }
  return updateResults;
};

export const manageBusinessOperatingHours = async (
  _: unknown,
  args: ManageBusinessOperatingHoursInput,
  context: any
) => {
  // Validate input data using Zod
  const validatedData = ManageBusinessOperatingHoursSchema.parse(args);

  if (!validatedData?.operatingHours) return;

  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      businessDetails: {
        include: {
          operatingHours: true,
        },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const updateResults = [];

  for (const operatingHour of validatedData.operatingHours) {
    const existingDayOfWeek = business.businessDetails?.operatingHours.find(
      (hour) => hour.dayOfWeek === operatingHour.dayOfWeek
    );

    if (operatingHour.toDelete) {
      // If toDelete is true, delete the image
      if (existingDayOfWeek) {
        await prisma.businessOperatingHours.delete({
          where: {
            businessDetailsId_dayOfWeek: {
              businessDetailsId: business.businessDetails!.id,
              dayOfWeek: existingDayOfWeek.dayOfWeek,
            },
          },
        });

        updateResults.push({
          message: `Business day of week ${existingDayOfWeek.dayOfWeek} deleted successfully.`,
        });
      } else {
        updateResults.push({
          message: "Business day of week not found to delete.",
        });
      }
    } else if (existingDayOfWeek) {
      // If the image exists and toDelete is not true, update it
      const updatedDayOfWeek = await prisma.businessOperatingHours.update({
        where: {
          businessDetailsId_dayOfWeek: {
            businessDetailsId: business.businessDetails!.id,
            dayOfWeek: existingDayOfWeek.dayOfWeek,
          },
        },
        data: {
          openingTime: operatingHour.openingTime,
          closingTime: operatingHour.closingTime,
        },
      });

      updateResults.push({
        ...updatedDayOfWeek,
        message: "Business day of week updated successfully.",
      });
    } else {
      // If the address does not exist, create a new one
      const newDayOfWeek = await prisma.businessOperatingHours.create({
        data: {
          openingTime: operatingHour.openingTime,
          closingTime: operatingHour.closingTime,
          dayOfWeek: operatingHour.dayOfWeek,
          businessDetails: {
            connect: { id: business.businessDetails!.id },
          },
        },
      });

      updateResults.push({
        ...newDayOfWeek,
        message: "Business day of week added successfully.",
      });
    }
  }

  return updateResults;
};

export const getBusinessAdminNotices = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (
    !context.owner?.businessId ||
    typeof context.owner.businessId !== "string"
  ) {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findFirstOrThrow({
    where: {
      id: context.owner.businessId,
      deletedAt: null,
      isBlocked: false,
      primaryContacts: {
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

  if (!business) {
    throw new Error("Business not found!");
  }

  const result = [];

  result.push(business.adminNotice);

  const allBusinessNotice = await prisma.adminNotice.findMany({
    where: {
      deletedAt: null,
      type: "ALL_BUSINESS",
    },
  });

  result.push(...allBusinessNotice);

  return result;
};

export const businessSubscription = async () =>
  // _: unknown,
  // args: BusinessSubscriptionInput,
  // context: any
  {
    // if (
    //   !context.owner.businessId ||
    //   typeof context.owner.businessId !== "string"
    // ) {
    //   throw new Error("Invalid or missing token");
    // }

    // const business = await prisma.business.findFirstOrThrow({
    //   where: {
    //     id: context.owner.businessId,
    //     deletedAt: null,
    //     isBlocked: false,
    //     primaryContacts: {
    //       some: {
    //         isVerified: true,
    //         deletedAt: null,
    //       },
    //     },
    //   },
    //   include: {
    //     subscription: true,
    //   },
    // });

    // const validatedData = BusinessSubscriptionSchema.parse(args);

    // const plan = await prisma.businessSubscription.findFirst({
    //   where: {
    //     id: validatedData.subscriptionId,
    //     deletedAt: null,
    //   },
    // });

    // if (!plan?.price || !plan?.duration) {
    //   throw new Error("Invalid Plan");
    // }

    // const order = await razorpay.orders.create({
    //   amount: plan.price * 100,
    //   currency: "INR",
    //   receipt: business.id,
    // });

    // const updateBusiness = await prisma.business.update({
    //   where: {
    //     id: business.id,
    //   },
    //   data: {
    //     subscriptionId: plan.id,
    //     razorpay_order_id: order.id,
    //   },
    // });

    // return {
    //   ...order,
    // };

    return {
      message: "This route is not functional yet.",
    };
  };

export const businessVerifyPayment = async () =>
  // _: unknown,
  // args: BusinessVerifyPaymentInput
  {
    // const validatedData = BusinessVerifyPaymentSchema.parse(args);

    // const body = `${validatedData.razorpay_order_id}|${validatedData.razorpay_payment_id}`;

    // const generatedSignature = crypto
    //   .createHmac("sha256", process.env.RAZORPAY_API_SECRETS!)
    //   .update(body.toString())
    //   .digest("hex");

    // if (generatedSignature !== validatedData.razorpay_signature) {
    //   throw new Error("Incorrect razorpay signature. Validation failed!");
    // }

    // const business = await prisma.business.findUniqueOrThrow({
    //   where: {
    //     razorpay_order_id: validatedData.razorpay_order_id,
    //     deletedAt: null,
    //     primaryContacts: {
    //       some: {
    //         isVerified: true,
    //         deletedAt: null,
    //       },
    //     },
    //   },
    //   include: {
    //     subscription: true,
    //   },
    // });

    // const subscriptionExpire = new Date();
    // subscriptionExpire.setDate(
    //   subscriptionExpire.getDate() + business.subscription!.duration
    // );

    // const verifiedBusinessPayment = await prisma.business.update({
    //   where: {
    //     id: business.id,
    //   },
    //   data: {
    //     paymentVerification: true,
    //     subscriptionExpire: subscriptionExpire,
    //   },
    // });

    // return {
    //   ...verifiedBusinessPayment,
    //   message: "Payment Verified!",
    // };

    return {
      message: "This route is not functional yet.",
    };
  };
