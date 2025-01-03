import { prisma } from "../../../utils/dbConnect";
import {
  FeedbackInput,
  FeedbackSchema,
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
    // const review = await prisma.review.update({
    //   where: {
    //     id: validatedData.id,
    //     deletedAt: null,
    //     userId: user.id,
    //   },
    //   data: {
    //     rating: validatedData.rating,
    //     comment: validatedData.comment,
    //     businessId: validatedData.businessId,
    //     deletedAt: validatedData.toDelete ? new Date() : null,
    //   },
    // });

    // return review;

    return {
      message: "Updating Review is not allowed at this moment.",
    };
  }

  if (!validatedData.businessId && !validatedData.businessSlug) {
    throw new Error("Business Id is required");
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
        create: {
          userId: context.owner.userId,
          rating: validatedData.rating,
          comment: validatedData.comment,
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
