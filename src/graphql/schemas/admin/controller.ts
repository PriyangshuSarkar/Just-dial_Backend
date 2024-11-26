import { uploadToSpaces } from "../../../utils/bucket";
import { prisma } from "../../../utils/dbConnect";
import {
  AdminLoginInput,
  AdminLoginSchema,
  AllBusinessesInput,
  AllBusinessesSchema,
  AllUserInput,
  AllUsersSchema,
  BlockBusinessesInput,
  BlockBusinessesSchema,
  BlockUserInput,
  BlockUserSchema,
  ManageBusinessSubscriptionInput,
  ManageBusinessSubscriptionSchema,
  ManageCategoryInput,
  ManageCategorySchema,
  ManageCityInput,
  ManageCitySchema,
  ManageCountryInput,
  ManageCountrySchema,
  ManageCourtInput,
  ManageCourtSchema,
  ManageLanguageInput,
  ManageLanguageSchema,
  ManagePincodeInput,
  ManagePincodeSchema,
  ManageProficiencyInput,
  ManageProficiencySchema,
  ManageStateInput,
  ManageStateSchema,
  ManageTagInput,
  ManageTagSchema,
  ManageUserSubscriptionInput,
  ManageUserSubscriptionSchema,
  VerifyBusinessesInput,
  VerifyBusinessesSchema,
} from "./db";
import { sign } from "jsonwebtoken";

export const adminLogin = async (_: unknown, args: AdminLoginInput) => {
  const validatedData = AdminLoginSchema.parse(args);

  const admin = await prisma.admin.findFirst({
    where: { email: validatedData.email },
  });

  if (!admin) {
    throw new Error("Email doesn't exit!");
  }

  if (admin.password === validatedData.password) {
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
};

export const allUsers = async (_: unknown, args: AllUserInput) => {
  const validatedData = AllUsersSchema.parse(args);

  const skip = (validatedData.page - 1) * validatedData.limit;

  const where: any = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.contacts = {
      some: {
        OR: [
          validatedData.email && {
            type: "EMAIL",
            value: { contains: validatedData.email, mode: "insensitive" },
          },
          validatedData.phone && {
            type: "PHONE",
            value: { contains: validatedData.phone },
          },
        ].filter(Boolean),
      },
    };
  }
  if (validatedData.hasSubscription !== undefined) {
    where.subscriptionId = validatedData.hasSubscription ? { not: null } : null;
  }

  if (validatedData.subscriptionId) {
    where.subscriptionId = validatedData.subscriptionId;
  }

  if (validatedData.createdAtStart || validatedData.createdAtEnd) {
    where.createdAt = {
      ...(validatedData.createdAtStart && {
        gte: new Date(validatedData.createdAtStart),
      }),
      ...(validatedData.createdAtEnd && {
        lte: new Date(validatedData.createdAtEnd),
      }),
    };
  }

  // Execute query
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        contacts: true,
        subscription: true,
        addresses: true,
      },
      skip,
      take: validatedData.limit,
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    ...users,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const allBusinesses = async (_: unknown, args: AllBusinessesInput) => {
  const validatedData = AllBusinessesSchema.parse(args);

  const skip = (validatedData.page - 1) * validatedData.limit;

  const where: any = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.primaryContacts = {
      some: {
        OR: [
          validatedData.email && {
            type: "EMAIL",
            value: { contains: validatedData.email, mode: "insensitive" },
            deletedAt: null,
          },
          validatedData.phone && {
            type: "PHONE",
            value: { contains: validatedData.phone },
            deletedAt: null,
          },
        ].filter(Boolean),
      },
    };
  }

  if (validatedData.type) {
    where.type = validatedData.type;
  }

  if (validatedData.isBusinessVerified !== undefined) {
    where.isBusinessVerified = validatedData.isBusinessVerified;
  }

  if (validatedData.isListed !== undefined) {
    where.isListed = validatedData.isListed;
  }

  if (validatedData.hasSubscription !== undefined) {
    where.subscriptionId = validatedData.hasSubscription ? { not: null } : null;
  }

  if (validatedData.subscriptionId) {
    where.subscriptionId = validatedData.subscriptionId;
  }

  if (validatedData.categoryId) {
    where.businessDetails = {
      categoryId: validatedData.categoryId,
    };
  }

  if (validatedData.averageRatingMin || validatedData.averageRatingMax) {
    where.averageRating = {
      ...(validatedData.averageRatingMin !== undefined && {
        gte: validatedData.averageRatingMin,
      }),
      ...(validatedData.averageRatingMax !== undefined && {
        lte: validatedData.averageRatingMax,
      }),
    };
  }

  if (validatedData.createdAtStart || validatedData.createdAtEnd) {
    where.createdAt = {
      ...(validatedData.createdAtStart && {
        gte: new Date(validatedData.createdAtStart),
      }),
      ...(validatedData.createdAtEnd && {
        lte: new Date(validatedData.createdAtEnd),
      }),
    };
  }

  // Execute query
  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        primaryContacts: true,
        subscription: true,
        businessDetails: {
          include: {
            addresses: true,
            category: true,
            tags: true,
            images: true,
            websites: true,
          },
        },
      },
      skip,
      take: validatedData.limit,
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
    }),
    prisma.business.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    ...businesses,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const blockUsers = async (_: unknown, args: BlockUserInput) => {
  const { userIds } = BlockUserSchema.parse(args);

  const blockedUsers = await prisma.user.updateMany({
    where: {
      id: {
        in: userIds,
      },
    },
    data: {
      isBlocked: true,
    },
  });

  return {
    ...blockedUsers,
  };
};

export const blockBusinesses = async (
  _: unknown,
  args: BlockBusinessesInput
) => {
  const { businessIds } = BlockBusinessesSchema.parse(args);

  const blockedBusinesses = await prisma.business.updateMany({
    where: {
      id: {
        in: businessIds,
      },
    },
    data: {
      isBlocked: true,
    },
  });

  return {
    ...blockedBusinesses,
  };
};

export const verifyBusinesses = async (
  _: unknown,
  args: VerifyBusinessesInput
) => {
  const validatedData = VerifyBusinessesSchema.parse(args);

  const verifiedBusinesses = await prisma.business.updateMany({
    where: {
      id: { in: validatedData.businessIds },
    },
    data: {
      isBusinessVerified: true,
    },
  });

  return {
    ...verifiedBusinesses,
  };
};

export const manageUserSubscription = async (
  _: unknown,
  args: ManageUserSubscriptionInput
) => {
  const validatedData = ManageUserSubscriptionSchema.parse(args);

  if (!validatedData.id) {
    const newUserSubscription = await prisma.userSubscription.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        duration: validatedData.duration,
        features: validatedData.features,
      },
    });
    return {
      ...newUserSubscription,
    };
  } else {
    const updatedUserSubscription = await prisma.userSubscription.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        duration: validatedData.duration,
        features: validatedData.features,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });
    return {
      ...updatedUserSubscription,
    };
  }
};

export const manageBusinessSubscription = async (
  _: unknown,
  args: ManageBusinessSubscriptionInput
) => {
  const validatedData = ManageBusinessSubscriptionSchema.parse(args);

  if (!validatedData.id) {
    const newBusinessSubscription = await prisma.businessSubscription.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        price: validatedData.price,
        duration: validatedData.duration,
        features: validatedData.features,
        tierLevel: validatedData.tierLevel,
      },
    });
    return {
      ...newBusinessSubscription,
    };
  } else {
    const updatedBusinessSubscription =
      await prisma.businessSubscription.update({
        where: { id: validatedData.id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          type: validatedData.type,
          price: validatedData.price,
          duration: validatedData.duration,
          features: validatedData.features,
          tierLevel: validatedData.tierLevel,
          deletedAt: validatedData.toDelete ? new Date() : null,
        },
      });
    return {
      ...updatedBusinessSubscription,
    };
  }
};

export const manageLanguage = async (_: unknown, args: ManageLanguageInput) => {
  const validatedData = ManageLanguageSchema.parse(args);

  if (!validatedData.id) {
    const newLanguage = await prisma.language.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newLanguage,
    };
  } else {
    const updatedLanguage = await prisma.language.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });
    return {
      ...updatedLanguage,
    };
  }
};

export const manageProficiency = async (
  _: unknown,
  args: ManageProficiencyInput
) => {
  const validatedData = ManageProficiencySchema.parse(args);

  if (!validatedData.id) {
    const newProficiency = await prisma.proficiency.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newProficiency,
    };
  } else {
    const updatedProficiency = await prisma.proficiency.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });
    return {
      ...updatedProficiency,
    };
  }
};

export const manageCourt = async (_: unknown, args: ManageCourtInput) => {
  const validatedData = ManageCourtSchema.parse(args);

  if (!validatedData.id) {
    const newCourt = await prisma.court.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newCourt,
    };
  } else {
    const updatedCourt = await prisma.court.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });
    return {
      ...updatedCourt,
    };
  }
};

export const manageCategory = async (_: unknown, args: ManageCategoryInput) => {
  const validatedData = ManageCategorySchema.parse(args);

  let categoryImage = null;
  if (validatedData.categoryImage) {
    categoryImage = await uploadToSpaces(
      validatedData.categoryImage,
      "category_image"
    );
  }
  if (!validatedData.id) {
    const newCategory = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        categoryImage,
      },
    });
    return {
      ...newCategory,
    };
  } else {
    const updatedCategory = await prisma.category.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        categoryImage,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });
    return {
      ...updatedCategory,
    };
  }
};

export const manageTag = async (_: unknown, args: ManageTagInput) => {
  const validatedData = ManageTagSchema.parse(args);

  if (!validatedData.id) {
    const newTag = await prisma.tag.create({
      data: {
        name: validatedData.name,
      },
    });
    return {
      ...newTag,
    };
  } else {
    const updatedTag = await prisma.tag.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
      },
    });
    return {
      ...updatedTag,
    };
  }
};

export const manageCountry = async (_: unknown, args: ManageCountryInput) => {
  const validatedData = ManageCountrySchema.parse(args);

  if (!validatedData.id) {
    const newCountry = await prisma.country.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newCountry,
    };
  } else {
    const updatedCountry = await prisma.country.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...updatedCountry,
    };
  }
};

export const manageState = async (_: unknown, args: ManageStateInput) => {
  const validatedData = ManageStateSchema.parse(args);

  if (!validatedData.id) {
    const newState = await prisma.state.create({
      data: {
        countryId: validatedData.countryId,
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newState,
    };
  } else {
    const updatedState = await prisma.state.update({
      where: { id: validatedData.id },
      data: {
        countryId: validatedData.countryId,
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...updatedState,
    };
  }
};

export const manageCity = async (_: unknown, args: ManageCityInput) => {
  const validatedData = ManageCitySchema.parse(args);

  if (!validatedData.id) {
    const newCity = await prisma.city.create({
      data: {
        stateId: validatedData.stateId,
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...newCity,
    };
  } else {
    const updatedCity = await prisma.city.update({
      where: { id: validatedData.id },
      data: {
        stateId: validatedData.stateId,
        name: validatedData.name,
        slug: validatedData.slug,
      },
    });
    return {
      ...updatedCity,
    };
  }
};

export const managePincode = async (_: unknown, args: ManagePincodeInput) => {
  const validatedData = ManagePincodeSchema.parse(args);

  if (!validatedData.id) {
    const newPincode = await prisma.pincode.create({
      data: {
        cityId: validatedData.cityId,
        code: validatedData.code,
        slug: validatedData.slug,
      },
    });
    return {
      ...newPincode,
    };
  } else {
    const updatedPincode = await prisma.pincode.update({
      where: { id: validatedData.id },
      data: {
        cityId: validatedData.cityId,
        code: validatedData.code,
        slug: validatedData.slug,
      },
    });
    return {
      ...updatedPincode,
    };
  }
};
