import { prisma } from "../../../utils/dbConnect";
import { AllBusinessesInput, AllBusinessesSchema } from "./db";

export const allBusinesses = async (_: unknown, args: AllBusinessesInput) => {
  AllBusinessesSchema.parse(args);

  const businesses = await prisma.business.findMany({
    where: { isVerified: true, deletedAt: null },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: {
        include: {
          address: {
            include: {
              street: true,
              city: true,
              state: true,
              country: true,
              pincode: true,
            },
          },
          subcategory: {
            include: {
              category: true,
            },
          },
          tags: true,
          facilities: true,
        },
      },
      reviews: true,
      subscription: true,
    },
  });

  if (!businesses) {
    throw new Error("Businesses not found!");
  }

  return businesses;
};
