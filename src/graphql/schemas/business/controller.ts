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
  ManageBusinessImageInput,
  ManageBusinessImageSchema,
  AddBusinessPrimaryContactInput,
  AddBusinessPrimaryContactSchema,
  ManageBusinessSupportingDocumentsInput,
  ManageBusinessSupportingDocumentsSchema,
  // BusinessVerifyPaymentInput,
  // BusinessVerifyPaymentSchema,
  // BusinessSubscriptionInput,
  // BusinessSubscriptionSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendOtpEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import { generateToken } from "../../../utils/verifyToken";
import slugify from "slugify";
import { sendOtpPhone } from "../../../utils/smsService";
import { createOtpData } from "../../../utils/generateOtp";
// import crypto from "crypto";
import { ContactType, Prisma } from "@prisma/client";
import { deleteFromSpaces, uploadToSpaces } from "../../../utils/bucket";
// import { razorpay } from "../../../utils/razorpay";

const MAX_CONTACTS_PER_TYPE = 1;
const MAX_DAILY_VERIFICATION_ATTEMPTS = 5;

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
      id: context.owner.id,
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
          images: {
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
          languages: {
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
    throw new Error("Business not found!");
  }

  return {
    ...business,
  };
};

export const businessSignup = async (_: unknown, args: BusinessSignupInput) => {
  const validatedData = BusinessSignupSchema.parse(args);

  return await prisma.$transaction(async (tx) => {
    const existingContact = await tx.businessPrimaryContact.findFirst({
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

    // Send verification codes
    try {
      if (validatedData.email && emailOtpData) {
        await sendOtpEmail(null, validatedData.email, emailOtpData.otp);
      }
      if (validatedData.phone && phoneOtpData) {
        await sendOtpPhone(null, validatedData.phone, phoneOtpData.otp);
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

export const verifyBusinessPrimaryContact = async (
  _: unknown,
  args: VerifyBusinessPrimaryContactInput
) => {
  const validatedData = VerifyBusinessPrimaryContactSchema.parse(args);

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
          update: passwordUpdate,
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
                images: {
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
      ...verifiedContact.business,
      token,
      message: `${type === "EMAIL" ? "Email" : "Phone"} verified successfully!`,
    };
  });
};

export const businessLogin = async (_: unknown, args: BusinessLoginInput) => {
  const validatedData = BusinessLoginSchema.parse(args);

  const value = validatedData.email || validatedData.phone;

  const existingContact = await prisma.businessPrimaryContact.findFirst({
    where: {
      value,
      isVerified: true,
      deletedAt: null,
    },
  });
  if (!existingContact) {
    throw new Error(`${value} doesn't exit!`);
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
          images: {
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
    throw new Error("Email doesn't exit!");
  }

  const verify = verifyPassword(
    validatedData.password,
    business.salt!,
    business.password!
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
};

export const addBusinessPrimaryContact = async (
  _: unknown,
  args: AddBusinessPrimaryContactInput,
  context: any
) => {
  const validatedData = AddBusinessPrimaryContactSchema.parse(args);

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

    // Send OTP
    try {
      if (type === "EMAIL") {
        await sendOtpEmail(newContact.business.name, value!, otpData.otp);
      } else {
        await sendOtpPhone(newContact.business.name, value!, otpData.otp);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Delete the contact if OTP sending fails
      await tx.businessPrimaryContact.delete({
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

export const forgetBusinessPassword = async (
  _: unknown,
  args: ForgetBusinessPasswordInput
) => {
  const validatedData = ForgetBusinessPasswordSchema.parse(args);

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
    const newContact = await tx.businessPrimaryContact.create({
      data: {
        businessId: existingContact.businessId,
        type,
        value: value!,
        ...otpData,
      },
      include: {
        business: true,
      },
    });

    // Send OTP
    try {
      if (type === "EMAIL") {
        await sendOtpEmail(newContact.business.name, value!, otpData.otp);
      } else {
        await sendOtpPhone(newContact.business.name, value!, otpData.otp);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Delete the contact if OTP sending fails
      await tx.businessPrimaryContact.delete({
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

export const changeBusinessPassword = async (
  _: unknown,
  args: ChangeBusinessPasswordInput
) => {
  const validatedData = ChangeBusinessPasswordSchema.parse(args);

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
            images: {
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
  const validatedData = UpdateBusinessDetailsSchema.parse(args);

  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findFirst({
    where: {
      id: context.owner.id,
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

  let slug = validatedData.slug;

  if (!slug && !business.slug && validatedData.name) {
    slug = slugify(validatedData.name, { lower: true, strict: true });
    let uniqueSuffixLength = 2;
    let existingSlug = await prisma.business.findFirst({ where: { slug } });

    while (existingSlug) {
      const uniqueSuffix = Math.random()
        .toString(16)
        .slice(2, 2 + uniqueSuffixLength);
      slug = `${slugify(validatedData.name, {
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
      registrationNumber:
        validatedData.registrationNumber ||
        business.businessDetails?.registrationNumber,
      license: validatedData.license || business.businessDetails?.license,
      experience:
        validatedData.experience || business.businessDetails?.experience,
      teamSize: validatedData.teamSize || business.businessDetails?.teamSize,
      description:
        validatedData.description || business.businessDetails?.description,
      latitude: validatedData.latitude || business.businessDetails?.latitude,
      longitude: validatedData.latitude || business.businessDetails?.longitude,
      gstNumber: validatedData.gstNumber || business.businessDetails?.gstNumber,
      category: validatedData.categoryId
        ? { connect: { id: validatedData.categoryId } }
        : undefined,
      degree: validatedData.degrees || business.businessDetails?.degree,
      languages:
        validatedData.languages && validatedData.languages.length
          ? {
              connectOrCreate: validatedData.languages.map(
                (language: string) => ({
                  where: { name: language }, // Check if the language with this name exists
                  create: { name: language }, // If it doesn't exist, create it
                })
              ),
            }
          : undefined,
      proficiencies:
        validatedData.proficiencies && validatedData.proficiencies.length
          ? {
              connectOrCreate: validatedData.proficiencies.map(
                (proficiency: string) => ({
                  where: { name: proficiency }, // Check if the language with this name exists
                  create: { name: proficiency }, // If it doesn't exist, create it
                })
              ),
            }
          : undefined,
      courts:
        validatedData.courts && validatedData.courts.length
          ? {
              connectOrCreate: validatedData.courts.map((court: string) => ({
                where: { name: court }, // Check if the language with this name exists
                create: { name: court }, // If it doesn't exist, create it
              })),
            }
          : undefined,
      tags:
        validatedData.tags && validatedData.tags.length
          ? {
              connectOrCreate: validatedData.tags.map((tag: string) => ({
                where: { name: tag }, // Check if the language with this name exists
                create: { name: tag }, // If it doesn't exist, create it
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
      category: validatedData.categoryId
        ? { connect: { id: validatedData.categoryId } }
        : undefined,
      degree: validatedData.degrees,
      languages:
        validatedData.languages && validatedData.languages.length
          ? {
              connect: validatedData.languages.map((languageId: string) => ({
                id: languageId,
              })),
            }
          : undefined,
      proficiencies:
        validatedData.proficiencies && validatedData.proficiencies.length
          ? {
              connectOrCreate: validatedData.proficiencies.map(
                (proficiency: string) => ({
                  where: { name: proficiency }, // Check if the language with this name exists
                  create: { name: proficiency }, // If it doesn't exist, create it
                })
              ),
            }
          : undefined,
      courts:
        validatedData.courts && validatedData.courts.length
          ? {
              connectOrCreate: validatedData.courts.map((court: string) => ({
                where: { name: court }, // Check if the language with this name exists
                create: { name: court }, // If it doesn't exist, create it
              })),
            }
          : undefined,
      tags:
        validatedData.tags && validatedData.tags.length
          ? {
              connectOrCreate: validatedData.tags.map((tag: string) => ({
                where: { name: tag }, // Check if the language with this name exists
                create: { name: tag }, // If it doesn't exist, create it
              })),
            }
          : undefined,
    },
  });

  // Update business details
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id, deletedAt: null },
    data: {
      name: validatedData.name || business.name,
      type: validatedData.type || business.type,
      slug: slug || business.slug,
      isListed: validatedData.isListed || business.isListed,
      additionalContacts:
        validatedData.additionalContacts || business.additionalContacts,
      businessDetails: { connect: { id: updatedBusinessDetails.id } },
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
          images: {
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
            images: true,
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

    if (business.businessDetails?.images) {
      await tx.businessImage.updateMany({
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
            images: {
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
  // Validate input data using Zod
  const validatedData = ManageBusinessAddressSchema.parse(args);

  // Verify the token and get the business ID

  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.id,
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

  const updatedAddresses = [];

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
          order: addressData.order || existingAddress.order,
          street: addressData.street || existingAddress.street,
          city: addressData.city || existingAddress.city,
          state: addressData.state || existingAddress.state,
          country: addressData.country || existingAddress.country,
          pincode: addressData.pincode || existingAddress.pincode,
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
  // Validate input data using Zod
  const validatedData = ManageBusinessWebsiteSchema.parse(args);

  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.id,
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
          url: websiteData.url || existingWebsite.url,
          type: websiteData.type || existingWebsite.type,
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

export const manageBusinessImage = async (
  _: unknown,
  args: ManageBusinessImageInput,
  context: any
) => {
  // Validate input data using Zod
  const validatedData = ManageBusinessImageSchema.parse(args);

  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.id,
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
          images: {
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

  for (const imageData of validatedData.images) {
    const existingImage = imageData.imageId
      ? business.businessDetails?.images.find(
          (image) => image.id === imageData.imageId
        )
      : null;

    if (imageData.toDelete) {
      // If toDelete is true, delete the image
      if (existingImage) {
        await deleteFromSpaces(existingImage.url);
        await prisma.businessImage.delete({
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
      const updatedImage = await prisma.businessImage.update({
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
      const newImage = await prisma.businessImage.create({
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

  // Verify the token and get the business ID
  if (!context.owner || typeof context.owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business, ensuring they have a verified contact
  const business = await prisma.business.findUnique({
    where: {
      id: context.owner.id,
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
          type: documentData.type || existingDocument.type,
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
    //     id: context.owner.id,
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
