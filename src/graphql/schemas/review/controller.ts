import { prisma } from "../../../utils/dbConnect";
import {
  FeedbackInput,
  FeedbackSchema,
  GetReviewWithIdInput,
  GetReviewWithIdSchema,
  ReviewBusinessInput,
  ReviewBusinessSchema,
} from "./db";

export const reviewBusiness = async (
  _: unknown,
  args: ReviewBusinessInput,
  context: any
) => {
  if (!context.owner?.userId || typeof context.owner.userId !== "string") {
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

  const validatedData = ReviewBusinessSchema.parse(args);

  if (!validatedData) return;

  if (validatedData.id) {
    const review = await prisma.review.findFirst({
      where: {
        id: validatedData.id,
        deletedAt: null,
        userId: user.id,
      },
    });

    if (!review) {
      throw new Error(
        "Review not found or you are not authorized to update this review."
      );
    }

    const business = await prisma.business.findFirst({
      where: {
        id: review.businessId,
      },
      select: { averageRating: true, reviewCount: true },
    });

    if (!business) {
      throw new Error("Business associated with this review not found.");
    }

    const newRating = validatedData.toDelete ? 0 : validatedData.rating || 0;

    // Recalculate the average rating before updating
    const adjustedAverageRating =
      (business.averageRating! * business.reviewCount -
        review.rating +
        newRating) /
      business.reviewCount;

    await prisma.business.update({
      where: {
        id: review.businessId,
      },
      data: {
        averageRating: adjustedAverageRating,
        reviewCount: validatedData.toDelete
          ? business.reviewCount - 1
          : undefined,
      },
    });

    const updatedReview = await prisma.review.update({
      where: {
        id: validatedData.id,
        userId: user.id,
      },
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });

    return {
      ...updatedReview,
      message: validatedData.toDelete
        ? "Review deleted successfully."
        : "Review updated successfully.",
    };
  }

  if (!validatedData.businessId && !validatedData.businessSlug) {
    throw new Error("Business Id or slug is required");
  }
  if (!validatedData.rating) {
    throw new Error("Rating is required");
  }

  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { id: validatedData.businessId },
        { slug: validatedData.businessSlug },
      ],
    },
    select: { id: true, averageRating: true, reviewCount: true },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  let { averageRating, reviewCount } = business;

  averageRating = averageRating || 0;
  reviewCount = reviewCount || 0;

  const newAverageRating =
    (averageRating * reviewCount + validatedData.rating) / (reviewCount + 1);

  const updatedBusiness = await prisma.business.update({
    where: {
      id: business.id,
    },
    data: {
      averageRating: newAverageRating,
      reviewCount: reviewCount + 1,
      reviews: {
        update: {
          where: {
            id: validatedData.id,
          },
          data: {
            userId: context.owner.userId,
            rating: validatedData.rating,
            comment: validatedData.comment,
          },
        },
      },
    },
    select: {
      averageRating: true,
      reviewCount: true,
      reviews: {
        where: {
          deletedAt: null,
        },
        select: {
          rating: true,
          comment: true,
          businessId: true,
          userId: true,
        },
      },
    },
  });

  return { ...updatedBusiness, message: "Review created successfully" };
};

export const feedback = async (
  _: unknown,
  args: FeedbackInput,
  context: any
) => {
  const { owner } = context;

  if (!owner || (!owner.userId && !owner.businessId)) {
    throw new Error("Invalid or missing token");
  }

  const entityId = owner.userId || owner.businessId;
  const entityType = owner.userId ? "user" : "business";

  let entity;

  // Validate the existence of the entity
  if (entityType === "user") {
    entity = await prisma.user.findFirst({
      where: {
        id: entityId,
        deletedAt: null,
        contacts: {
          some: {
            isVerified: true,
            deletedAt: null,
          },
        },
      },
    });
  } else {
    entity = await prisma.business.findFirst({
      where: {
        id: entityId,
        deletedAt: null,
        primaryContacts: {
          some: {
            isVerified: true,
            deletedAt: null,
          },
        },
      },
    });
  }

  if (!entity) {
    throw new Error(
      `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found!`
    );
  }

  // Validate and parse feedback data
  const validatedData = FeedbackSchema.parse(args);

  if (!validatedData) return;

  if (validatedData.id) {
    // Update feedback if ID is provided
    const feedback = await prisma.feedback.update({
      where: {
        id: validatedData.id,
        deletedAt: null,
        [`${entityType}Id`]: entityId,
      },
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });

    return feedback;
  }

  if (!validatedData.rating) {
    throw new Error("Rating is required");
  }

  // Create new feedback
  const feedback = await prisma.feedback.create({
    data: {
      [`${entityType}Id`]: entityId,
      rating: validatedData.rating,
      comment: validatedData.comment,
    },
  });

  return { ...feedback, message: "Feedback created successfully" };
};

export const getReviewWithId = async (
  _: unknown,
  args: GetReviewWithIdInput,
  context: any
) => {
  const validatedData = GetReviewWithIdSchema.parse(args);
  if (!validatedData) return;

  const { userId, businessId } = context.owner || {};

  const isUserContext = typeof userId === "string";
  const isBusinessContext = typeof businessId === "string";

  const validateDataForContext = () => {
    if (
      isUserContext &&
      !validatedData.id &&
      !validatedData.businessId &&
      !validatedData.businessSlug
    ) {
      throw new Error("Review id or business slug/ID is required with token");
    }
    if (
      isBusinessContext &&
      !validatedData.id &&
      !validatedData.userId &&
      !validatedData.userSlug
    ) {
      throw new Error("Review id or user slug/ID is required with token");
    }
    if (
      !isUserContext &&
      !isBusinessContext &&
      !validatedData.id &&
      !validatedData.userId &&
      !validatedData.userSlug &&
      !validatedData.businessId &&
      !validatedData.businessSlug
    ) {
      throw new Error(
        "Review id or user slug/ID and business slug/ID is required"
      );
    }
  };

  validateDataForContext();

  let user = undefined;
  let business = undefined;

  if (isUserContext) {
    user = await prisma.user.findFirst({
      where: {
        id: userId,
        contacts: {
          some: {
            isVerified: true,
            deletedAt: null,
          },
        },
      },
    });
    if (!user) {
      throw new Error("Invalid Token! OR User not found");
    }
  } else if (isBusinessContext) {
    business = await prisma.business.findFirst({
      where: {
        id: businessId,
        primaryContacts: {
          some: {
            isVerified: true,
            deletedAt: null,
          },
        },
      },
    });
    if (!business) {
      throw new Error("Invalid Token! OR Business not found");
    }
  }

  const review = await prisma.review.findFirst({
    where: {
      OR: [
        { id: validatedData.id },
        {
          AND: [
            {
              OR: [
                { userId: user?.id || validatedData.userId },
                { user: { slug: validatedData.userSlug } },
              ],
            },
            {
              OR: [
                { businessId: business?.id || validatedData.businessId },
                { business: { slug: validatedData.businessSlug } },
              ],
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      comment: true,
      rating: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      businessId: true,
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
        },
      },
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessDetails: {
            select: {
              logo: true,
            },
          },
        },
      },
    },
  });

  return review;
};
