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
  AdminDeleteReviewsInput,
  AdminDeleteReviewsSchema,
  AdminGetAllAdminNoticesInput,
  AdminGetAllAdminNoticesSchema,
  AdminGetAllBusinessAdBannerImagesInput,
  AdminGetAllBusinessAdBannerImagesSchema,
  AdminGetAllBusinessMobileAdBannerImagesInput,
  AdminGetAllBusinessMobileAdBannerImagesSchema,
  AdminGetAllTestimonialsInput,
  AdminGetAllTestimonialsSchema,
  AdminGetBusinessByIdInput,
  AdminGetBusinessByIdSchema,
  AdminGetUserByIdInput,
  AdminGetUserByIdSchema,
  AdminLoginInput,
  AdminLoginSchema,
  AdminManageAdminNoticesInput,
  AdminManageAdminNoticesSchema,
  AdminManageBusinessAdBannerImageInput,
  AdminManageBusinessAdBannerImageSchema,
  AdminManageBusinessMobileAdBannerImageInput,
  AdminManageBusinessMobileAdBannerImageSchema,
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

  const where: Prisma.UserWhereInput = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.contacts = {
      some: {
        OR: [
          validatedData.email
            ? {
                type: "EMAIL",
                value: { contains: validatedData.email, mode: "insensitive" },
                deleteAt: null,
              }
            : null,
          validatedData.phone
            ? {
                type: "PHONE",
                value: { contains: validatedData.phone },
                deleteAt: null,
              }
            : null,
        ].filter(
          (condition): condition is Exclude<typeof condition, null> =>
            condition !== null
        ) as Prisma.UserContactWhereInput[],
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

  if (validatedData.sortBy === "alphabetical") {
    validatedData.sortBy = "name" as "alphabetical" | "createdAt" | "updatedAt";
  }

  if (validatedData.hasAdminNotice === true) {
    where.adminNotice = {
      deletedAt: null,
      expiresAt: {
        gt: new Date(), // Filters for notices that have not expired
      },
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
        reviews: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
        feedbacks: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
        testimonials: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
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
      reviews: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
      feedbacks: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
      testimonials: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
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

  const where: Prisma.BusinessWhereInput = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.primaryContacts = {
      some: {
        OR: [
          validatedData.email
            ? {
                type: "EMAIL",
                value: { contains: validatedData.email, mode: "insensitive" },
                deletedAt: null,
              }
            : null,
          validatedData.phone
            ? {
                type: "PHONE",
                value: { contains: validatedData.phone },
                deletedAt: null,
              }
            : null,
        ].filter(
          (condition): condition is Exclude<typeof condition, null> =>
            condition !== null
        ) as Prisma.BusinessPrimaryContactWhereInput[],
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
      categories: {
        some: {
          id: validatedData.categoryId,
          deletedAt: null,
        },
      },
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

  if (validatedData.sortBy === "alphabetical") {
    validatedData.sortBy = "name" as "alphabetical" | "createdAt" | "updatedAt";
  }

  if (validatedData.hasAdminNotice !== undefined) {
    where.adminNotice = validatedData.hasAdminNotice
      ? {
          deletedAt: null,
          expiresAt: {
            gt: new Date(), // Filters for notices that have not expired
          },
        }
      : {
          NOT: {
            deletedAt: null,
            expiresAt: {
              gt: new Date(), // Ensures no valid notices exist
            },
          },
        };
  }

  if (validatedData.hasReviews !== undefined) {
    where.reviews = validatedData.hasReviews
      ? {
          some: {
            deletedAt: null,
          },
        }
      : {
          none: {
            deletedAt: null,
          },
        };
  }

  if (validatedData.hasFeedbacks !== undefined) {
    where.feedbacks = validatedData.hasFeedbacks
      ? {
          some: {
            deletedAt: null,
          },
        }
      : {
          none: {
            deletedAt: null,
          },
        };
  }

  if (validatedData.hasBusinessAdBanners !== undefined) {
    where.businessDetails = {
      adBannerImages: validatedData.hasBusinessAdBanners
        ? {
            some: {
              deletedAt: null,
            },
          }
        : {
            none: {
              deletedAt: null,
            },
          },
    };
  }

  if (validatedData.hasBusinessMobileAdBanners !== undefined) {
    where.businessDetails = {
      mobileAdBannerImages: validatedData.hasBusinessMobileAdBanners
        ? {
            some: {
              deletedAt: null,
            },
          }
        : {
            none: {
              deletedAt: null,
            },
          },
    };
  }

  if (validatedData.hasAdminBusinessAdBanners !== undefined) {
    where.businessDetails = {
      adBannerImages: validatedData.hasAdminBusinessAdBanners
        ? {
            some: {
              adminBusinessAdBannerImage: {
                isNot: null, // Check if a related AdminBusinessAdBannerImage exists
              },
            },
          }
        : {
            none: {
              adminBusinessAdBannerImage: {
                isNot: null, // Ensure no related AdminBusinessAdBannerImage exists
              },
            },
          },
    };
  }

  if (validatedData.hasAdminBusinessMobileAdBanners !== undefined) {
    where.businessDetails = {
      mobileAdBannerImages: validatedData.hasAdminBusinessMobileAdBanners
        ? {
            some: {
              adminBusinessMobileAdBannerImage: {
                isNot: null, // Check if a related AdminBusinessMobileAdBannerImage exists
              },
            },
          }
        : {
            none: {
              adminBusinessMobileAdBannerImage: {
                isNot: null, // Ensure no related AdminBusinessMobileAdBannerImage exists
              },
            },
          },
    };
  }

  if (validatedData.hasTestimonials !== undefined) {
    where.testimonials = validatedData.hasTestimonials
      ? {
          some: {
            deletedAt: null,
          },
        }
      : {
          none: {
            deletedAt: null,
          },
        };
  }

  // Execute query
  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        primaryContacts: true,
        subscription: true,
        reviews: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
        feedbacks: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
        testimonials: {
          where: {
            deletedAt: null,
          },
          include: {
            user: true,
            business: true,
          },
          take: 20,
        },
        adminNotice: true,
        businessDetails: {
          include: {
            addresses: true,
            categories: true,
            tags: true,
            coverImages: true,
            adBannerImages: {
              include: {
                adminBusinessAdBannerImage: true,
              },
            },
            mobileAdBannerImages: {
              include: {
                adminBusinessMobileAdBannerImage: true,
              },
            },
            websites: true,
            operatingHours: true,
            languages: true,
            proficiencies: true,
            courts: true,
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
      reviews: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
      feedbacks: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
      testimonials: {
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          business: true,
        },
        take: 20,
      },
      adminNotice: true,
      businessDetails: {
        include: {
          addresses: true,
          categories: true,
          tags: true,
          coverImages: true,
          adBannerImages: {
            include: {
              adminBusinessAdBannerImage: true,
            },
          },
          mobileAdBannerImages: {
            include: {
              adminBusinessMobileAdBannerImage: true,
            },
          },
          websites: true,
          operatingHours: true,
          languages: true,
          proficiencies: true,
          courts: true,
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
        deletedAt: null,
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
        deletedAt: null,
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

export const adminDeleteReviews = async (
  _: unknown,
  args: AdminDeleteReviewsInput,
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
  const validatedData = AdminDeleteReviewsSchema.parse(args);
  if (!validatedData?.reviews) return;

  // Delete the reviews

  const result = [];

  for (const review of validatedData.reviews) {
    const updatedReview = await prisma.review.update({
      where: { id: review.reviewId },
      data: {
        deletedAt: review.toDelete ? new Date() : null,
      },
    });
    if (updatedReview.deletedAt) {
      result.push({ message: "Review deleted successfully" });
    }
  }
  return result;
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
        deletedAt: null,
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

  const results = [];
  for (const language of validatedData.languages) {
    let result;
    if (!language.id) {
      // Create a new language
      result = await prisma.language.create({
        data: {
          name: language.name,
          slug: language.slug,
        },
      });
    } else {
      // Update the existing language
      result = await prisma.language.update({
        where: { id: language.id },
        data: {
          name: language.name,
          slug: language.slug,
          deletedAt: language.toDelete ? new Date() : null,
        },
      });
    }
    results.push(result);
  }

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

  const results = [];
  for (const proficiency of validatedData.proficiencies) {
    let result;
    if (!proficiency.id) {
      // Create a new proficiency
      result = await prisma.proficiency.create({
        data: {
          name: proficiency.name,
          slug: proficiency.slug,
        },
      });
    } else {
      // Update an existing proficiency
      result = await prisma.proficiency.update({
        where: { id: proficiency.id },
        data: {
          name: proficiency.name,
          slug: proficiency.slug,
          deletedAt: proficiency.toDelete ? new Date() : null,
        },
      });
    }
    results.push(result);
  }

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

  const results = [];
  for (const court of validatedData.courts) {
    let result;
    if (!court.id) {
      // Create a new court
      result = await prisma.court.create({
        data: {
          name: court.name,
          slug: court.slug,
        },
      });
    } else {
      // Update an existing court
      result = await prisma.court.update({
        where: { id: court.id },
        data: {
          name: court.name,
          slug: court.slug,
          deletedAt: court.toDelete ? new Date() : null,
        },
      });
    }
    results.push(result);
  }

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
    include: {
      groupName: true,
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

  const results = [];

  for (const category of validatedData.categories) {
    let categoryImage: string | undefined = undefined;

    if (category.categoryImage) {
      if (category.id) {
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
        categoryImage = await uploadToSpaces(
          category.categoryImage,
          "category_image",
          null
        );
      }
    }

    if (!category.id) {
      // Creating a new category
      if (!category.name) {
        results.push({
          message: "Category name is required!",
        });
        continue;
      }
      let slug: string | undefined = undefined;
      const initialSlug = category.slug || category.name;
      if (initialSlug) {
        slug = slugify(initialSlug, {
          lower: true,
          strict: true,
        });

        let uniqueSuffixLength = 2;
        let existingSlug = await prisma.category.findFirst({ where: { slug } });

        while (existingSlug) {
          const uniqueSuffix = Math.random()
            .toString(16)
            .slice(2, 2 + uniqueSuffixLength);
          slug = `${slugify(initialSlug, {
            lower: true,
            strict: true,
          })}-${uniqueSuffix}`;
          existingSlug = await prisma.category.findFirst({ where: { slug } });
          uniqueSuffixLength += 1;
        }
      }

      const newCategory = await prisma.category.create({
        data: {
          name: category.name,
          slug: slug,
          order: category.order,
          description: category.description,
          categoryImage,
          groupName: category.groupName
            ? {
                connectOrCreate: {
                  where: {
                    name: category.groupName,
                  },
                  create: {
                    name: category.groupName,
                    slug: slugify(category.groupName, {
                      lower: true,
                      strict: true,
                    }),
                  },
                },
              }
            : undefined,
        },
        include: {
          groupName: true,
        },
      });
      results.push({
        ...newCategory,
        message: "Category created successfully!",
      });
    } else {
      const existingCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });

      if (!existingCategory) {
        results.push({ message: "Category not found!" });
        continue;
      }

      let slug: string | undefined = undefined;
      const initialSlug = category.slug || category.name;
      if (
        (category.slug && initialSlug) ||
        (!existingCategory?.slug && initialSlug)
      ) {
        slug = slugify(initialSlug, {
          lower: true,
          strict: true,
        });

        let uniqueSuffixLength = 2;
        let existingSlug = await prisma.category.findFirst({ where: { slug } });

        while (existingSlug) {
          const uniqueSuffix = Math.random()
            .toString(16)
            .slice(2, 2 + uniqueSuffixLength);
          slug = `${slugify(initialSlug, {
            lower: true,
            strict: true,
          })}-${uniqueSuffix}`;
          existingSlug = await prisma.category.findFirst({ where: { slug } });
          uniqueSuffixLength += 1;
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id: category.id },
        data: {
          name: category.name,
          slug: category.toDelete ? null : slug,
          order: category.order,
          description: category.description,
          categoryImage,
          deletedAt: category.toDelete ? new Date() : null,
          groupName: category.groupName
            ? {
                connectOrCreate: {
                  where: {
                    name: category.groupName,
                  },
                  create: {
                    name: category.groupName,
                  },
                },
              }
            : undefined,
        },
        include: {
          groupName: true,
        },
      });

      results.push({
        ...updatedCategory,
        message: category.toDelete
          ? "Category deleted successfully!"
          : "Category updated successfully!",
      });
    }
  }

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

  const results = [];

  for (const tag of validatedData.tags) {
    if (!tag.id) {
      // Create a new tag
      const newTag = await prisma.tag.create({
        data: {
          name: tag.name,
        },
      });
      results.push({ ...newTag, message: "Tag created successfully!" });
    } else {
      // Update an existing tag
      const existingTag = await prisma.tag.findUnique({
        where: { id: tag.id },
      });

      if (!existingTag) {
        results.push({ id: tag.id, message: "Tag not found!" });
        continue;
      }

      const updatedTag = await prisma.tag.update({
        where: { id: tag.id },
        data: {
          name: tag.name,
        },
      });
      results.push({ ...updatedTag, message: "Tag updated successfully!" });
    }
  }

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

  const results = [];

  for (const country of validatedData.countries) {
    if (!country.id) {
      // Create a new country
      const newCountry = await prisma.country.create({
        data: {
          name: country.name,
          slug: country.slug,
        },
      });
      results.push({ ...newCountry, message: "Country created successfully!" });
    } else {
      // Update an existing country
      const existingCountry = await prisma.country.findUnique({
        where: { id: country.id },
      });

      if (!existingCountry) {
        results.push({ id: country.id, message: "Country not found!" });
        continue;
      }

      const updatedCountry = await prisma.country.update({
        where: { id: country.id },
        data: {
          name: country.name,
          slug: country.slug,
        },
      });
      results.push({
        ...updatedCountry,
        message: "Country updated successfully!",
      });
    }
  }

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

  const results = [];

  for (const state of validatedData.states) {
    if (!state.id) {
      // Create a new state
      const newState = await prisma.state.create({
        data: {
          countryId: state.countryId,
          name: state.name,
          slug: state.slug,
        },
      });
      results.push({ ...newState, message: "State created successfully!" });
    } else {
      // Update an existing state
      const existingState = await prisma.state.findUnique({
        where: { id: state.id },
      });

      if (!existingState) {
        results.push({ id: state.id, message: "State not found!" });
        continue;
      }

      const updatedState = await prisma.state.update({
        where: { id: state.id },
        data: {
          countryId: state.countryId,
          name: state.name,
          slug: state.slug,
        },
      });
      results.push({ ...updatedState, message: "State updated successfully!" });
    }
  }

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

  const results = [];

  for (const city of validatedData.cities) {
    if (!city.id) {
      // Create a new city
      const newCity = await prisma.city.create({
        data: {
          stateId: city.stateId,
          name: city.name,
          slug: city.slug,
        },
      });
      results.push({ ...newCity, message: "City created successfully!" });
    } else {
      // Update an existing city
      const existingCity = await prisma.city.findUnique({
        where: { id: city.id },
      });

      if (!existingCity) {
        results.push({ id: city.id, message: "City not found!" });
        continue;
      }

      const updatedCity = await prisma.city.update({
        where: { id: city.id },
        data: {
          stateId: city.stateId,
          name: city.name,
          slug: city.slug,
        },
      });
      results.push({ ...updatedCity, message: "City updated successfully!" });
    }
  }

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

  const results = [];

  for (const pincode of validatedData.pincodes) {
    if (!pincode.id) {
      // Create a new pincode
      const newPincode = await prisma.pincode.create({
        data: {
          cityId: pincode.cityId,
          code: pincode.code,
          slug: pincode.slug,
        },
      });
      results.push({ ...newPincode, message: "Pincode created successfully!" });
    } else {
      // Update an existing pincode
      const existingPincode = await prisma.pincode.findUnique({
        where: { id: pincode.id },
      });

      if (!existingPincode) {
        results.push({ id: pincode.id, message: "Pincode not found!" });
        continue;
      }

      const updatedPincode = await prisma.pincode.update({
        where: { id: pincode.id },
        data: {
          cityId: pincode.cityId,
          code: pincode.code,
          slug: pincode.slug,
        },
      });
      results.push({
        ...updatedPincode,
        message: "Pincode updated successfully!",
      });
    }
  }

  return results;
};

export const adminGetAllTestimonials = async (
  _: unknown,
  args: AdminGetAllTestimonialsInput,
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

  const validatedData = AdminGetAllTestimonialsSchema.parse(args);
  if (!validatedData) return;

  const { page, limit, type, filter, sortBy, sortOrder } = validatedData;

  let sort = sortBy;
  sort = (sort === "alphabetical" ? "name" : sort) as
    | "alphabetical"
    | "createdAt"
    | "updatedAt";

  let where: Prisma.TestimonialWhereInput = {
    deletedAt: null,
    order: {
      not: null,
    },
  };

  if (type === "REVIEW") {
    where = {
      type,
    };
  } else if (type === "FEEDBACK") {
    where = {
      type,
    };
  }

  if (filter === "BUSINESS") {
    where = {
      businessId: filter === "BUSINESS" ? { not: null } : undefined,
    };
  } else if (filter === "USER") {
    where = {
      userId: filter === "USER" ? { not: null } : undefined,
    };
  }

  const [testimonials, total] = await Promise.all([
    await prisma.testimonial.findMany({
      where,
      include: {
        user: true,
        business: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: sortOrder },
    }),
    await prisma.testimonial.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    testimonials,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
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

  const results = [];

  for (const testimonial of validatedData.testimonials) {
    const entityId = testimonial.reviewId || testimonial.feedbackId;
    const entityType = testimonial.reviewId ? "REVIEW" : "FEEDBACK";

    // Handle deletion of testimonial
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
        results.push({ message: "Testimonial not found." });
        continue;
      }

      // Delete the testimonial
      const deletedTestimonial = await prisma.testimonial.delete({
        where: {
          id: testimonialToDelete.id,
        },
      });
      results.push({
        ...deletedTestimonial,
        message: "Testimonial deleted successfully!",
      });
      continue;
    }

    // Retrieve the associated review or feedback
    let existingReview;
    if (entityType === "REVIEW") {
      existingReview = await prisma.review.findFirst({
        where: { id: entityId },
      });
    } else {
      existingReview = await prisma.feedback.findFirst({
        where: { id: entityId },
      });
    }

    if (!existingReview) {
      throw new Error("Associated review/feedback not found.");
    }

    const existingTestimonial = await prisma.testimonial.findFirst({
      where: {
        OR: [
          { id: testimonial.id },
          { reviewId: testimonial.reviewId },
          { feedbackId: testimonial.feedbackId },
        ],
      },
    });

    // Create or update the testimonial
    const createdTestimonial = await prisma.testimonial.upsert({
      where: {
        id: existingTestimonial?.id || "", // Using the found testimonial's id
      },
      update: {
        order: testimonial.order || undefined,
        type: entityType || undefined,
        rating: existingReview?.rating || undefined,
        comment: existingReview?.comment || undefined,
      },
      create: {
        reviewId: testimonial.reviewId,
        feedbackId: testimonial.feedbackId,
        order: testimonial.order,
        type: entityType,
        rating: existingReview?.rating,
        comment: existingReview?.comment,
        businessId: existingReview?.businessId,
        userId: existingReview?.userId,
      },
    });

    results.push({
      ...createdTestimonial,
      message: "Testimonial created/updated successfully!",
    });
  }

  return results;
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

  if (validatedData.sortBy === "alphabetical") {
    validatedData.sortBy = "name" as "alphabetical" | "createdAt" | "updatedAt";
  }

  const skip = (validatedData.page - 1) * validatedData.limit;

  const [notices, total] = await Promise.all([
    prisma.adminNotice.findMany({
      where: {
        deletedAt: null,
        type: validatedData.type,
        expiresAt: {
          gt: new Date(), // Filters for notices that have not expired
        },
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
        expiresAt: {
          gt: new Date(), // Filters for notices that have not expired
        },
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

  const results = [];

  for (const notice of validatedData.adminNotices) {
    if (notice.toDelete) {
      // Handle deletion of notice
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
        results.push({ message: "Notice not found for deletion" });
        continue;
      }

      // Delete the matched notice
      const deletedNotice = await prisma.adminNotice.delete({
        where: { id: noticeToDelete.id },
      });
      results.push({
        ...deletedNotice,
        message: "Notice deleted successfully",
      });
    } else {
      // Handle update or creation of a notice
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
        // Update the existing notice
        const updatedNotice = await prisma.adminNotice.update({
          where: { id: existingAdminNotice.id },
          data: {
            note: notice.note,
          },
        });
        results.push({
          ...updatedNotice,
          message: "Notice updated successfully",
        });
      } else {
        const ADMIN_NOTICE_EXPIRY_DAYS = parseInt(
          process.env.ADMIN_NOTICE_EXPIRY_DAYS || "7",
          7
        );
        // Create a new notice
        const data: Prisma.AdminNoticeCreateInput = {
          expiresAt:
            notice.expiresAt ||
            new Date(
              Date.now() + ADMIN_NOTICE_EXPIRY_DAYS! * 24 * 60 * 60 * 1000
            ),
          note: notice.note,
          type: notice.type || "GLOBAL", // Default to "GLOBAL" if type is not provided
        };

        if (notice.businessId || notice.businessSlug) {
          data.business = {
            connect: notice.businessId
              ? { id: notice.businessId }
              : { slug: notice.businessSlug },
          };
          data.type = "INDIVIDUAL_BUSINESS"; // Set the type to business-specific
        } else if (notice.userId || notice.userSlug) {
          data.user = {
            connect: notice.userId
              ? { id: notice.userId }
              : { slug: notice.userSlug },
          };
          data.type = "INDIVIDUAL_USER"; // Set the type to user-specific
        }

        const createdNotice = await prisma.adminNotice.create({
          data,
        });
        results.push({
          ...createdNotice,
          message: "Notice created successfully",
        });
      }
    }
  }

  return results;
};

export const adminGetAllBusinessAdBannerImages = async (
  _: unknown,
  args: AdminGetAllBusinessAdBannerImagesInput,
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

  const validatedData = AdminGetAllBusinessAdBannerImagesSchema.parse(args);

  if (!validatedData) return;

  const skip = (validatedData.page - 1) * validatedData.limit;

  const [images, total] = await Promise.all([
    await prisma.businessAdBannerImage.findMany({
      where: {
        adminBusinessAdBannerImage: {
          isNot: null,
        },
      },
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
      skip,
      take: validatedData.limit,
    }),
    await prisma.businessAdBannerImage.count({
      where: {
        adminBusinessAdBannerImage: {
          isNot: null,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    images,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const adminManageBusinessAdBannerImage = async (
  _: unknown,
  args: AdminManageBusinessAdBannerImageInput,
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

  const validatedData = AdminManageBusinessAdBannerImageSchema.parse(args);

  if (!validatedData?.businessAdBannerImages) return;

  const results = [];

  for (const businessAdBannerImage of validatedData.businessAdBannerImages) {
    if (businessAdBannerImage.toDelete) {
      const existingBusinessAdBannerImage =
        await prisma.adminBusinessAdBannerImage.findFirst({
          where: {
            id: businessAdBannerImage.id,
          },
        });

      if (!existingBusinessAdBannerImage) {
        results.push({ message: "Image not found for deletion" });
      } else {
        const createdAdminBusinessAdBannerImage =
          await prisma.adminBusinessAdBannerImage.delete({
            where: {
              id: existingBusinessAdBannerImage.id,
            },
          });

        if (createdAdminBusinessAdBannerImage) {
          results.push({ message: "Image deleted successfully" });
        }
      }
    } else {
      const createdAdminBusinessAdBannerImage =
        await prisma.adminBusinessAdBannerImage.create({
          data: {
            businessAdBannerImage: {
              connect: {
                id: businessAdBannerImage.id,
              },
            },
            order: businessAdBannerImage.order,
          },
        });
      results.push(createdAdminBusinessAdBannerImage);
    }
  }

  return results;
};

export const adminGetAllBusinessMobileAdBannerImages = async (
  _: unknown,
  args: AdminGetAllBusinessMobileAdBannerImagesInput,
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

  const validatedData =
    AdminGetAllBusinessMobileAdBannerImagesSchema.parse(args);

  if (!validatedData) return;

  const skip = (validatedData.page - 1) * validatedData.limit;

  const [images, total] = await Promise.all([
    await prisma.businessMobileAdBannerImage.findMany({
      where: {
        adminBusinessMobileAdBannerImage: {
          isNot: null,
        },
      },
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
      skip,
      take: validatedData.limit,
    }),
    await prisma.businessMobileAdBannerImage.count({
      where: {
        adminBusinessMobileAdBannerImage: {
          isNot: null,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    images,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const adminManageBusinessMobileAdBannerImage = async (
  _: unknown,
  args: AdminManageBusinessMobileAdBannerImageInput,
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

  const validatedData =
    AdminManageBusinessMobileAdBannerImageSchema.parse(args);

  if (!validatedData?.businessMobileAdBannerImages) return;

  const results = [];

  for (const businessMobileAdBannerImage of validatedData.businessMobileAdBannerImages) {
    if (businessMobileAdBannerImage.toDelete) {
      const existingBusinessMobileAdBannerImage =
        await prisma.adminBusinessMobileAdBannerImage.findFirst({
          where: {
            id: businessMobileAdBannerImage.id,
          },
        });

      if (!existingBusinessMobileAdBannerImage) {
        results.push({ message: "Image not found for deletion" });
      } else {
        const createdAdminBusinessMobileAdBannerImage =
          await prisma.adminBusinessMobileAdBannerImage.delete({
            where: {
              id: existingBusinessMobileAdBannerImage.id,
            },
          });

        if (createdAdminBusinessMobileAdBannerImage) {
          results.push({ message: "Image deleted successfully" });
        }
      }
    } else {
      const createdAdminBusinessMobileAdBannerImage =
        await prisma.adminBusinessMobileAdBannerImage.create({
          data: {
            businessMobileAdBannerImage: {
              connect: {
                id: businessMobileAdBannerImage.id,
              },
            },
            order: businessMobileAdBannerImage.order,
          },
        });
      results.push(createdAdminBusinessMobileAdBannerImage);
    }
  }

  return results;
};
