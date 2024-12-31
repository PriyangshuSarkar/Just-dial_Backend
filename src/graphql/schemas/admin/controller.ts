import { uploadToSpaces } from "../../../utils/bucket";
import { prisma } from "../../../utils/dbConnect";
import { generateToken } from "../../../utils/token";
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
  ManageTestimonialInput,
  ManageTestimonialSchema,
  ManageUserSubscriptionInput,
  ManageUserSubscriptionSchema,
  SearchAllReviewsInput,
  SearchAllReviewsSchema,
  VerifyBusinessesInput,
  VerifyBusinessesSchema,
} from "./db";

export const adminLogin = async (_: unknown, args: AdminLoginInput) => {
  const validatedData = AdminLoginSchema.parse(args);

  if (!validatedData) return;

  const admin = await prisma.admin.findFirst({
    where: { email: validatedData.email },
  });

  if (!admin) {
    throw new Error("Email doesn't exit!");
  }

  if (admin.password === validatedData.password) {
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

export const allUsers = async (
  _: unknown,
  args: AllUserInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const validatedData = AllUsersSchema.parse(args);

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

export const allBusinesses = async (
  _: unknown,
  args: AllBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const validatedData = AllBusinessesSchema.parse(args);
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

export const searchAllReviews = async (
  _: unknown,
  args: SearchAllReviewsInput,
  context: any
) => {
  // Validate the adminId in the context
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Validate and parse the input data
  const validatedData = SearchAllReviewsSchema.parse(args);
  if (!validatedData) return;

  const { search, sortBy, sortOrder, page, limit } = validatedData;

  // Calculate pagination values
  const skip = (page - 1) * limit;

  // Fetch reviews with filtering, sorting, and pagination
  const reviews = await prisma.review.findMany({
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
  });

  // Count the total number of matching reviews
  const total = await prisma.review.count({
    where: {
      comment: search
        ? {
            contains: search,
            mode: "insensitive",
          }
        : undefined,
    },
  });

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

export const blockUsers = async (
  _: unknown,
  args: BlockUserInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const validatedData = BlockUserSchema.parse(args);
  if (!validatedData) return;

  const { userIds } = validatedData;

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
  args: BlockBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const validatedData = BlockBusinessesSchema.parse(args);

  if (!validatedData) return;

  const { businessIds } = validatedData;

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
  args: VerifyBusinessesInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = VerifyBusinessesSchema.parse(args);

  if (!validatedData) return;

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
  args: ManageUserSubscriptionInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageUserSubscriptionSchema.parse(args);

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

export const manageBusinessSubscription = async (
  _: unknown,
  args: ManageBusinessSubscriptionInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageBusinessSubscriptionSchema.parse(args);

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

export const manageLanguage = async (
  _: unknown,
  args: ManageLanguageInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageLanguageSchema.parse(args);

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

export const manageProficiency = async (
  _: unknown,
  args: ManageProficiencyInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageProficiencySchema.parse(args);

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

export const manageCourt = async (
  _: unknown,
  args: ManageCourtInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageCourtSchema.parse(args);

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

export const manageCategory = async (
  _: unknown,
  args: ManageCategoryInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageCategorySchema.parse(args);

  if (!validatedData?.categories) return;

  const processCategory = async (category: any) => {
    let categoryImage = null;

    if (category.categoryImage) {
      if (category.id) {
        // Replace existing image if category ID exists
        const existingCategory = await prisma.category.findUnique({
          where: { id: category.id },
        });
        categoryImage = await uploadToSpaces(
          category.categoryImage,
          "category_image",
          existingCategory?.categoryImage
        );
      } else {
        // Upload new image if no category ID exists
        categoryImage = await uploadToSpaces(
          category.categoryImage,
          "category_image",
          null
        );
      }
    }

    if (!category.id) {
      // Create a new category
      return prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          categoryImage,
        },
      });
    } else {
      // Update an existing category
      return prisma.category.update({
        where: { id: category.id },
        data: {
          name: category.name,
          slug: category.slug,
          categoryImage,
          deletedAt: category.toDelete ? new Date() : null,
        },
      });
    }
  };

  const results = await Promise.all(
    validatedData.categories.map(processCategory)
  );
  return results;
};

export const manageTag = async (
  _: unknown,
  args: ManageTagInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageTagSchema.parse(args);

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

export const manageCountry = async (
  _: unknown,
  args: ManageCountryInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageCountrySchema.parse(args);

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

export const manageState = async (
  _: unknown,
  args: ManageStateInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageStateSchema.parse(args);

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

export const manageCity = async (
  _: unknown,
  args: ManageCityInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManageCitySchema.parse(args);

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

export const managePincode = async (
  _: unknown,
  args: ManagePincodeInput,
  context: any
) => {
  if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
    throw new Error("Invalid or missing token");
  }
  const validatedData = ManagePincodeSchema.parse(args);

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

export const manageTestimonial = async (
  _: unknown,
  args: ManageTestimonialInput
  // context: any
) => {
  // if (!context.owner.adminId || typeof context.owner.adminId !== "string") {
  //   throw new Error("Invalid or missing token");
  // }
  const validatedData = ManageTestimonialSchema.parse(args);

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
