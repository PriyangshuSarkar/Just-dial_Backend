import { prisma } from "../../../utils/dbConnect";
import { ReviewBusinessInput, ReviewBusinessSchema } from "./db";

export const reviewBusiness = async (
  _: unknown,
  args: ReviewBusinessInput,
  context: any
) => {
  const validatedData = ReviewBusinessSchema.parse(args);

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

  if (validatedData.id) {
    const review = await prisma.review.update({
      where: {
        id: validatedData.id,
        deletedAt: null,
        userId: context.owner.userId,
      },
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        businessId: validatedData.businessId,
        deletedAt: validatedData.toDelete ? new Date() : null,
      },
    });

    return review;
  }

  if (!validatedData.businessId) {
    throw new Error("Business Id is required");
  }
  if (!validatedData.rating) {
    throw new Error("Rating is required");
  }

  const review = await prisma.review.create({
    data: {
      userId: context.owner.userId,
      rating: validatedData.rating,
      comment: validatedData.comment,
      businessId: validatedData.businessId,
    },
  });

  return review;
};
