import { Prisma } from "@prisma/client";
import { deleteFromSpaces, uploadToSpaces } from "../../../utils/bucket";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { generateToken } from "../../../utils/token";
import {
  AdminAllBusinessesInput,
  AdminAllBusinessesSchema,
  AdminAllUsersInput,
  AdminAllUsersSchema,
  AdminBlockBusinessesInput,
  AdminBlockBusinessesSchema,
  AdminBlockUsersInput,
  AdminBlockUsersSchema,
  AdminChangePasswordInput,
  AdminChangePasswordSchema,
  AdminGetAllAdminNoticesInput,
  AdminGetAllAdminNoticesSchema,
  AdminGetBusinessByIdInput,
  AdminGetBusinessByIdSchema,
  AdminGetUserByIdInput,
  AdminGetUserByIdSchema,
  AdminLoginInput,
  AdminLoginSchema,
  AdminManageAdminNoticesInput,
  AdminManageAdminNoticesSchema,
  AdminManageBusinessSubscriptionsInput,
  AdminManageBusinessSubscriptionsSchema,
  AdminManageCategoriesInput,
  AdminManageCategoriesSchema,
  AdminManageCitiesInput,
  AdminManageCitiesSchema,
  AdminManageCountriesInput,
  AdminManageCountriesSchema,
  AdminManageCourtsInput,
  AdminManageCourtsSchema,
  AdminManageLanguagesInput,
  AdminManageLanguagesSchema,
  AdminManagePincodesInput,
  AdminManagePincodesSchema,
  AdminManageProficienciesInput,
  AdminManageProficienciesSchema,
  AdminManageStatesInput,
  AdminManageStatesSchema,
  AdminManageTagsInput,
  AdminManageTagsSchema,
  AdminManageTestimonialsInput,
  AdminManageTestimonialsSchema,
  AdminManageUserSubscriptionsInput,
  AdminManageUserSubscriptionsSchema,
  AdminSearchAllReviewsInput,
  AdminSearchAllReviewsSchema,
  AdminVerifyBusinessesInput,
  AdminVerifyBusinessesSchema,
} from "./db";
import slugify from "slugify";

export const adminLogin = async (_: unknown, args: AdminLoginInput) => {
  const validatedData = AdminLoginSchema.parse(args);

  if (!validatedData) return;

  const admin = await prisma.admin.findFirst({
    where: { email: validatedData.email },
  });

  if (!admin) {
    throw new Error("Email doesn't exit!");
  }
  const verify = verifyPassword(
    validatedData.password,
    admin.salt!,
    admin.password!
  );

  if (verify) {
    const token = generateToken(admin.id, "ADMIN");

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

export const adminChangePassword = async (
  _: unknown,
  args: AdminChangePasswordInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminChangePasswordSchema.parse(args);

  if (!validatedData) return;

  let passwordUpdate = {};

  if (validatedData.password) {
    const { salt, hash } = hashPassword(validatedData.password);
    passwordUpdate = { password: hash, salt };
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      ...passwordUpdate,
    },
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    message: "Password changed successfully.",
  };
};

export const adminAllUsers = async (
  _: unknown,
  args: AdminAllUsersInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminAllUsersSchema.parse(args);

  if (!validatedData) return;

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
    users,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const adminGetUserById = async (
  _: unknown,
  args: AdminGetUserByIdInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminGetUserByIdSchema.parse(args);

  if (!validatedData) return;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: validatedData.userId }, { slug: validatedData.userSlug }],
    },
    include: {
      contacts: true,
      subscription: true,
      addresses: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const adminAllBusinesses = async (
  _: unknown,
  args: AdminAllBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminAllBusinessesSchema.parse(args);
  if (!validatedData) return;

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
            categories: true,
            tags: true,
            coverImages: true,
            adBannerImages: true,
            mobileAdBannerImages: true,
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
    businesses,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const adminGetBusinessById = async (
  _: unknown,
  args: AdminGetBusinessByIdInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminGetBusinessByIdSchema.parse(args);

  if (!validatedData) return;

  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { id: validatedData.businessId },
        { slug: validatedData.businessSlug },
      ],
    },
    include: {
      primaryContacts: true,
      subscription: true,
      businessDetails: {
        include: {
          addresses: true,
          categories: true,
          tags: true,
          coverImages: true,
          adBannerImages: true,
          mobileAdBannerImages: true,
          websites: true,
        },
      },
    },
  });

  if (!business) {
    throw new Error("User not found");
  }

  return business;
};

export const adminSearchAllReviews = async (
  _: unknown,
  args: AdminSearchAllReviewsInput,
  context: any
) => {
  // Validate the adminId in the context
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  // Validate and parse the input data
  const validatedData = AdminSearchAllReviewsSchema.parse(args);
  if (!validatedData) return;

  const { search, sortBy, sortOrder, page, limit } = validatedData;

  // Calculate pagination values
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        comment: search
          ? {
              contains: search,
              mode: "insensitive", // Case-insensitive search
            }
          : undefined,
      },
      orderBy: {
        [sortBy]: sortOrder, // Dynamic sorting
      },
      skip,
      take: limit,
    }),
    prisma.review.count({
      where: {
        comment: search
          ? {
              contains: search,
              mode: "insensitive",
            }
          : undefined,
      },
    }),
  ]);

  // `reviews` contains the paginated reviews
  // `total` contains the total count of matching reviews

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Return the response in the desired format
  return {
    reviews,
    total,
    page,
    limit,
    totalPages,
  };
};

export const adminSearchAllFeedbacks = async (
  _: unknown,
  args: AdminSearchAllReviewsInput,
  context: any
) => {
  // Validate the adminId in the context
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  // Validate and parse the input data
  const validatedData = AdminSearchAllReviewsSchema.parse(args);
  if (!validatedData) return;

  const { search, sortBy, sortOrder, page, limit } = validatedData;

  // Calculate pagination values
  const skip = (page - 1) * limit;

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where: {
        comment: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      orderBy: {
        [sortBy]: sortOrder, // Dynamic sorting
      },
      skip,
      take: limit,
    }),
    prisma.feedback.count({
      where: {
        comment: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    }),
  ]);

  // `feedbacks` contains the paginated feedbacks
  // `total` contains the total count of matching feedbacks

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Return the response in the desired format
  return {
    feedbacks,
    total,
    page,
    limit,
    totalPages,
  };
};

export const adminBlockUsers = async (
  _: unknown,
  args: AdminBlockUsersInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminBlockUsersSchema.parse(args);
  if (!validatedData?.users) return;

  const result = [];

  const { users } = validatedData;

  for (const user of users) {
    let updatedUser: any;
    if (user.userId) {
      updatedUser = await prisma.user.update({
        where: {
          id: user.userId,
        },
        data: {
          isBlocked: user.block,
        },
      });
    } else if (user.userSlug) {
      updatedUser = await prisma.user.update({
        where: {
          slug: user.userSlug,
        },
        data: {
          isBlocked: user.block,
        },
      });
    } else {
      updatedUser.message = "User not found";
    }

    result.push(updatedUser);
  }

  return result;
};

export const adminBlockBusinesses = async (
  _: unknown,
  args: AdminBlockBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminBlockBusinessesSchema.parse(args);

  if (!validatedData?.businesses) return;

  const { businesses } = validatedData;

  const result = [];

  for (const business of businesses) {
    let updatedBusinesses: any;
    if (business.businessId) {
      updatedBusinesses = await prisma.business.update({
        where: {
          id: business.businessId,
        },
        data: {
          isBlocked: business.block,
        },
      });
    } else if (business.businessSlug) {
      updatedBusinesses = await prisma.business.update({
        where: {
          slug: business.businessSlug,
        },
        data: {
          isBlocked: business.block,
        },
      });
    } else {
      updatedBusinesses.message = "Business not found";
    }

    result.push(updatedBusinesses);
  }

  return result;
};

export const adminVerifyBusinesses = async (
  _: unknown,
  args: AdminVerifyBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminVerifyBusinessesSchema.parse(args);

  if (!validatedData?.businesses) return;

  const { businesses } = validatedData;

  const result = [];

  for (const business of businesses) {
    let updatedBusinesses: any;
    if (business.businessId) {
      updatedBusinesses = await prisma.business.update({
        where: {
          id: business.businessId,
        },
        data: {
          isBusinessVerified: business.verify,
        },
      });
    } else if (business.businessSlug) {
      updatedBusinesses = await prisma.business.update({
        where: {
          slug: business.businessSlug,
        },
        data: {
          isBusinessVerified: business.verify,
        },
      });
    } else {
      updatedBusinesses.message = "Business not found";
    }

    result.push(updatedBusinesses);
  }

  return result;
};

export const adminGetAllUserSubscriptions = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const userSubscriptions = await prisma.userSubscription.findMany({});

  return userSubscriptions;
};

export const adminManageUserSubscriptions = async (
  _: unknown,
  args: AdminManageUserSubscriptionsInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageUserSubscriptionsSchema.parse(args);

  if (!validatedData) return;

  if (!validatedData.id) {
    if (
      !validatedData.name ||
      !validatedData.price ||
      !validatedData.duration
    ) {
      throw new Error("Name, Price and Duration are required");
    }
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

export const adminGetAllBusinessSubscriptions = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const businessSubscriptions = await prisma.businessSubscription.findMany({});

  return businessSubscriptions;
};

export const adminManageBusinessSubscriptions = async (
  _: unknown,
  args: AdminManageBusinessSubscriptionsInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageBusinessSubscriptionsSchema.parse(args);

  if (!validatedData) return;

  if (!validatedData.id) {
    if (
      !validatedData.name ||
      !validatedData.price ||
      !validatedData.duration
    ) {
      throw new Error("Name, Price and Duration are required");
    }
    const newBusinessSubscription = await prisma.businessSubscription.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: "FIRM",
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

export const adminGetAllLanguages = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const languages = await prisma.language.findMany({});

  return languages;
};

export const adminManageLanguages = async (
  _: unknown,
  args: AdminManageLanguagesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageLanguagesSchema.parse(args);

  if (!validatedData?.languages) return;

  const results = await Promise.all(
    validatedData.languages.map(async (language) => {
      if (!language.id) {
        const newLanguage = await prisma.language.create({
          data: {
            name: language.name,
            slug: language.slug,
          },
        });
        return newLanguage;
      } else {
        const updatedLanguage = await prisma.language.update({
          where: { id: language.id },
          data: {
            name: language.name,
            slug: language.slug,
            deletedAt: language.toDelete ? new Date() : null,
          },
        });
        return updatedLanguage;
      }
    })
  );

  return results;
};

export const adminGetAllProficiencies = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const proficiencies = await prisma.proficiency.findMany({});

  return proficiencies;
};

export const adminManageProficiencies = async (
  _: unknown,
  args: AdminManageProficienciesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageProficienciesSchema.parse(args);

  if (!validatedData?.proficiencies) return;

  const results = await Promise.all(
    validatedData.proficiencies.map(async (proficiency) => {
      if (!proficiency.id) {
        return await prisma.proficiency.create({
          data: {
            name: proficiency.name,
            slug: proficiency.slug,
          },
        });
      } else {
        return await prisma.proficiency.update({
          where: { id: proficiency.id },
          data: {
            name: proficiency.name,
            slug: proficiency.slug,
            deletedAt: proficiency.toDelete ? new Date() : null,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllCourts = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const courts = await prisma.court.findMany({});

  return courts;
};

export const adminManageCourts = async (
  _: unknown,
  args: AdminManageCourtsInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageCourtsSchema.parse(args);

  if (!validatedData?.courts) return;

  const results = await Promise.all(
    validatedData.courts.map(async (court) => {
      if (!court.id) {
        return await prisma.court.create({
          data: {
            name: court.name,
            slug: court.slug,
          },
        });
      } else {
        return await prisma.court.update({
          where: { id: court.id },
          data: {
            name: court.name,
            slug: court.slug,
            deletedAt: court.toDelete ? new Date() : null,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllCategories = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
    },
  });

  return categories;
};

export const adminManageCategories = async (
  _: unknown,
  args: AdminManageCategoriesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageCategoriesSchema.parse(args);

  if (!validatedData?.categories) return;

  const processCategory = async (category: any) => {
    let categoryImage: string | undefined = undefined;

    if (category.categoryImage) {
      if (category.id) {
        // Replace existing image if category ID exists
        const existingCategory = await prisma.category.findUnique({
          where: { id: category.id },
        });
        if (existingCategory?.categoryImage && category.toDelete) {
          await deleteFromSpaces(existingCategory?.categoryImage);
          categoryImage = undefined;
        } else {
          categoryImage = await uploadToSpaces(
            category.categoryImage,
            "category_image",
            existingCategory?.categoryImage
          );
        }
      } else {
        if (category.categoryImage) {
          // Upload new image if no category ID exists
          categoryImage = await uploadToSpaces(
            category.categoryImage,
            "category_image",
            null
          );
        }
      }
    }

    if (!category.id) {
      // Update an existing category
      let slug = category.slug;
      if (!category.slug) {
        slug = slugify(category.name!, { lower: true, strict: true });
        let uniqueSuffixLength = 2;
        let existingSlug = await prisma.category.findFirst({ where: { slug } });

        while (existingSlug) {
          const uniqueSuffix = Math.random()
            .toString(16)
            .slice(2, 2 + uniqueSuffixLength);
          slug = `${slugify(category.name!, {
            lower: true,
            strict: true,
          })}-${uniqueSuffix}`;
          existingSlug = await prisma.category.findFirst({ where: { slug } });
          uniqueSuffixLength += 1;
        }
      }
      // Create a new category
      return {
        ...prisma.category.create({
          data: {
            name: category.name,
            slug: slug,
            order: category.order,
            description: category.description,
            categoryImage,
          },
        }),
        message: "Category created successfully!",
      };
    } else {
      const existingCategory = await prisma.category.findUnique({
        where: {
          id: category.id,
        },
      });

      if (!existingCategory) {
        return {
          message: "Category not found!",
        };
      }

      let slug = category.slug;
      if (!category.slug && existingCategory?.slug) {
        slug = slugify(category.name!, { lower: true, strict: true });
        let uniqueSuffixLength = 2;
        let existingSlug = await prisma.category.findFirst({ where: { slug } });

        while (existingSlug) {
          const uniqueSuffix = Math.random()
            .toString(16)
            .slice(2, 2 + uniqueSuffixLength);
          slug = `${slugify(category.name!, {
            lower: true,
            strict: true,
          })}-${uniqueSuffix}`;
          existingSlug = await prisma.category.findFirst({ where: { slug } });
          uniqueSuffixLength += 1;
        }
      }

      return {
        ...prisma.category.update({
          where: { id: category.id },
          data: {
            name: category.name,
            slug: category.toDelete ? null : slug,
            order: category.order,
            description: category.description,
            categoryImage,
            deletedAt: category.toDelete ? new Date() : null,
          },
        }),
        message: category.toDelete
          ? "Category deleted successfully!"
          : "Category updated successfully!",
      };
    }
  };

  const results = await Promise.all(
    validatedData.categories.map(processCategory)
  );
  return results;
};

export const adminGetAllTags = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const tags = await prisma.tag.findMany({});

  return tags;
};

export const adminManageTags = async (
  _: unknown,
  args: AdminManageTagsInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageTagsSchema.parse(args);

  if (!validatedData?.tags) return;

  const results = await Promise.all(
    validatedData.tags.map(async (tag) => {
      if (!tag.id) {
        return await prisma.tag.create({
          data: {
            name: tag.name,
          },
        });
      } else {
        return await prisma.tag.update({
          where: { id: tag.id },
          data: {
            name: tag.name,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllCountries = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const countries = await prisma.country.findMany({});

  return countries;
};

export const adminManageCountries = async (
  _: unknown,
  args: AdminManageCountriesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageCountriesSchema.parse(args);

  if (!validatedData?.countries) return;

  const results = await Promise.all(
    validatedData.countries.map(async (country) => {
      if (!country.id) {
        return await prisma.country.create({
          data: {
            name: country.name,
            slug: country.slug,
          },
        });
      } else {
        return await prisma.country.update({
          where: { id: country.id },
          data: {
            name: country.name,
            slug: country.slug,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllStates = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const states = await prisma.state.findMany({});

  return states;
};

export const adminManageStates = async (
  _: unknown,
  args: AdminManageStatesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageStatesSchema.parse(args);

  if (!validatedData?.states) return;

  const results = await Promise.all(
    validatedData.states.map(async (state) => {
      if (!state.id) {
        return await prisma.state.create({
          data: {
            countryId: state.countryId,
            name: state.name,
            slug: state.slug,
          },
        });
      } else {
        return await prisma.state.update({
          where: { id: state.id },
          data: {
            countryId: state.countryId,
            name: state.name,
            slug: state.slug,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllCities = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const cities = await prisma.city.findMany({});

  return cities;
};

export const adminManageCities = async (
  _: unknown,
  args: AdminManageCitiesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageCitiesSchema.parse(args);

  if (!validatedData?.cities) return;

  const results = await Promise.all(
    validatedData.cities.map(async (city) => {
      if (!city.id) {
        return await prisma.city.create({
          data: {
            stateId: city.stateId,
            name: city.name,
            slug: city.slug,
          },
        });
      } else {
        return await prisma.city.update({
          where: { id: city.id },
          data: {
            stateId: city.stateId,
            name: city.name,
            slug: city.slug,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllPincodes = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const pincodes = await prisma.pincode.findMany({});

  return pincodes;
};

export const adminManagePincodes = async (
  _: unknown,
  args: AdminManagePincodesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManagePincodesSchema.parse(args);

  if (!validatedData?.pincodes) return;

  const results = await Promise.all(
    validatedData.pincodes.map(async (pincode) => {
      if (!pincode.id) {
        return await prisma.pincode.create({
          data: {
            cityId: pincode.cityId,
            code: pincode.code,
            slug: pincode.slug,
          },
        });
      } else {
        return await prisma.pincode.update({
          where: { id: pincode.id },
          data: {
            cityId: pincode.cityId,
            code: pincode.code,
            slug: pincode.slug,
          },
        });
      }
    })
  );

  return results;
};

export const adminGetAllTestimonials = async (
  _: unknown,
  args: unknown,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }
  const testimonials = await prisma.testimonial.findMany({});

  return testimonials;
};

export const adminManageTestimonials = async (
  _: unknown,
  args: AdminManageTestimonialsInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageTestimonialsSchema.parse(args);

  if (!validatedData?.testimonials) return;

  const testimonial = await Promise.all(
    validatedData.testimonials.map(async (testimonial) => {
      const entityId = testimonial.reviewId || testimonial.feedbackId;
      const entityType = testimonial.reviewId ? "REVIEW" : "FEEDBACK";

      if (
        testimonial.toDelete &&
        (testimonial.id || testimonial.reviewId || testimonial.feedbackId)
      ) {
        const testimonialToDelete = await prisma.testimonial.findFirst({
          where: {
            OR: [
              { id: testimonial.id },
              { reviewId: testimonial.reviewId },
              { feedbackId: testimonial.feedbackId },
            ],
          },
        });

        if (!testimonialToDelete) {
          throw new Error("Testimonial not found.");
        }

        // Delete the matched testimonial
        return await prisma.testimonial.delete({
          where: {
            id: testimonialToDelete.id, // Use the unique `id` from the found testimonial
          },
        });
      }
      if (!testimonial.order) {
        throw new Error("Testimonial Order is required");
      }

      let existingReview;

      if (entityType === "REVIEW") {
        existingReview = await prisma.review.findFirst({
          where: {
            id: entityId,
          },
        });
      } else {
        existingReview = await prisma.feedback.findFirst({
          where: {
            id: entityId,
          },
        });
      }
      return await prisma.testimonial.create({
        data: {
          reviewId: testimonial.reviewId,
          feedbackId: testimonial.feedbackId,
          order: testimonial.order,
          type: entityType,
          rating: existingReview?.rating,
          comment: existingReview?.comment,
          businessId: existingReview?.businessId,
          userId: existingReview?.userId,
          createdAt: existingReview?.createdAt,
          updatedAt: existingReview?.updatedAt,
        },
      });
    })
  );

  return testimonial;
};

export const adminGetAllAdminNotices = async (
  _: unknown,
  args: AdminGetAllAdminNoticesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminGetAllAdminNoticesSchema.parse(args);

  if (!validatedData) return;

  const skip = (validatedData.page - 1) * validatedData.limit;

  const [notices, total] = await Promise.all([
    prisma.adminNotice.findMany({
      where: {
        deletedAt: null,
        type: validatedData.type,
      },
      skip,
      take: validatedData.limit,
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
    }),
    prisma.adminNotice.count({
      where: {
        deletedAt: null,
        type: validatedData.type,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    notices,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const adminManageAdminNotices = async (
  _: unknown,
  args: AdminManageAdminNoticesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const admin = await prisma.admin.findFirst({
    where: { id: context.owner.adminId, deletedAt: null },
  });

  if (!admin) {
    throw new Error("Unauthorized access");
  }

  const validatedData = AdminManageAdminNoticesSchema.parse(args);

  if (!validatedData?.adminNotices) return;

  const notices = await Promise.all(
    validatedData.adminNotices.map(async (notice) => {
      if (notice.toDelete) {
        const noticeToDelete = await prisma.adminNotice.findFirst({
          where: {
            OR: [
              { id: notice.id },
              { business: { id: notice.businessId } },
              { business: { slug: notice.businessSlug } },
              { user: { id: notice.userId } },
              { user: { slug: notice.userSlug } },
            ],
          },
        });

        if (!noticeToDelete) {
          throw new Error("Notice not found.");
        }

        // Delete the matched notice
        return await prisma.adminNotice.delete({
          where: {
            id: noticeToDelete.id, // Use the unique `id` from the found notice
          },
        });
      } else {
        const existingAdminNotice = await prisma.adminNotice.findFirst({
          where: {
            OR: [
              { id: notice.id },
              { business: { id: notice.businessId } },
              { business: { slug: notice.businessSlug } },
              { user: { id: notice.userId } },
              { user: { slug: notice.userSlug } },
            ],
          },
        });

        if (existingAdminNotice) {
          return await prisma.adminNotice.update({
            where: {
              id: existingAdminNotice.id,
            },
            data: {
              note: notice.note,
            },
          });
        } else {
          const data: Prisma.AdminNoticeCreateInput = {
            note: notice.note,
            type: notice.type || "GLOBAL", // Default to "GLOBAL" if type is not provided
          };

          if (notice.businessId || notice.businessSlug) {
            data.business = {
              connect: notice.businessId
                ? { id: notice.businessId }
                : { slug: notice.businessSlug },
            };
            data.type = "INDIVIDUAL_BUSINESS"; // Set the type to business specific
          } else if (notice.userId || notice.userSlug) {
            data.user = {
              connect: notice.userId
                ? { id: notice.userId }
                : { slug: notice.userSlug },
            };
            data.type = "INDIVIDUAL_USER"; // Set the type to user specific
          }

          return await prisma.adminNotice.create({
            data,
          });
        }
      }
    })
  );

  return notices;
};
