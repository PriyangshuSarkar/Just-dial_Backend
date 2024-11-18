import { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  FilterInput,
  LocationPriorityInput,
  SearchInput,
  SearchSchema,
} from "./db";

export const search = async (_: unknown, args: SearchInput) => {
  const {
    cityName,
    businessName,
    page = 1,
    limit = 10,
    ...filters
  } = SearchSchema.parse(args);

  const locationInfo = await getLocationHierarchy(cityName);

  const baseConditions: Prisma.BusinessWhereInput = {
    isListed: true,
    deletedAt: null,
    ...(businessName && {
      name: {
        contains: businessName,
        mode: "insensitive",
      },
    }),
  };

  const businesses = await getBusinessWithPriority(
    baseConditions,
    locationInfo,
    filters,
    page,
    limit
  );

  return businesses;
};

const getLocationHierarchy = async (
  cityName: string
): Promise<LocationPriorityInput> => {
  const city = await prisma.city.findFirst({
    where: {
      name: {
        equals: cityName,
        mode: "insensitive",
      },
    },
    include: {
      state: {
        include: {
          country: true,
        },
      },
    },
  });

  return {
    city: city?.name,
    state: city?.state?.name,
    country: city?.state?.country?.name,
  };
};

const getBusinessWithPriority = async (
  baseConditions: Prisma.BusinessWhereInput,
  location: LocationPriorityInput,
  filters: FilterInput,
  page: number,
  limit: number
) => {
  const now = new Date();

  // Build the orderBy clause based on filters
  const orderBy = buildOrderByClause(filters);

  // Build additional where conditions based on filters
  const whereConditions: Prisma.BusinessWhereInput = {
    ...baseConditions,
    ...(filters.verified && {
      isBusinessVerified: true,
    }),
    ...(filters.minPrice && { price: { gte: filters.minPrice } }),
    ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    ...(filters.minRating && { averageRating: { gte: filters.minRating } }),
    ...(filters.categoryId && {
      businessDetails: {
        categoryId: filters.categoryId,
      },
    }),
    ...(filters.languages && {
      businessDetails: {
        language: {
          some: {
            id: {
              in: filters.languages,
            },
          },
        },
      },
    }),
    ...(filters.courts && {
      businessDetails: {
        court: {
          some: {
            id: {
              in: filters.courts,
            },
          },
        },
      },
    }),
    ...(filters.proficiencies && {
      businessDetails: {
        proficiency: {
          some: {
            id: {
              in: filters.proficiencies,
            },
          },
        },
      },
    }),
  };

  // Fetch businesses with their details and addresses
  const businesses = await prisma.business.findMany({
    where: whereConditions,
    include: {
      subscription: true,
      businessDetails: {
        include: {
          addresses: true,
          language: true,
          court: true,
          proficiency: true,
          category: true,
          tags: true,
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  // Sort businesses based on location priority and featured status
  return businesses.sort((a, b) => {
    // Location priority scoring
    const scoreA = getLocationScore(a, location);
    const scoreB = getLocationScore(b, location);

    if (scoreA !== scoreB) return scoreB - scoreA;

    // Featured status (has active subscription)
    const isFeatureA = isBusinessFeatured(a, now);
    const isFeatureB = isBusinessFeatured(b, now);
    if (isFeatureA !== isFeatureB) return isFeatureB ? 1 : -1;

    // Rating comparison
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    if (ratingA !== ratingB) return ratingB - ratingA;

    // Updated at comparison
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
};

const getLocationScore = (
  business: any,
  location: LocationPriorityInput
): number => {
  const businessAddresses = business.businessDetails?.addresses || [];
  if (!businessAddresses.length) return 1;

  // Use the first address for scoring
  const primaryAddress = businessAddresses[0];

  if (primaryAddress.city.toLowerCase() === location.city?.toLowerCase())
    return 4;
  if (primaryAddress.state.toLowerCase() === location.state?.toLowerCase())
    return 3;
  if (primaryAddress.country.toLowerCase() === location.country?.toLowerCase())
    return 2;
  return 1;
};

const isBusinessFeatured = (business: any, currentDate: Date): boolean => {
  return (
    business.subscription?.id != null &&
    business.subscriptionExpire != null &&
    business.subscriptionExpire > currentDate
  );
};

const buildOrderByClause = (
  filters: FilterInput
):
  | Prisma.BusinessOrderByWithRelationInput
  | Prisma.BusinessOrderByWithRelationInput[] => {
  switch (filters.sortBy) {
    case "alphabetical":
      return { name: filters.order || "asc" };
    case "rating":
      return { averageRating: filters.order || "desc" };
    case "price":
      return { price: filters.order || "asc" };
    case "popularity":
      return [
        { reviewCount: filters.order || "desc" },
        { averageRating: "desc" },
      ];
    default:
      return [{ updatedAt: "desc" }];
  }
};
