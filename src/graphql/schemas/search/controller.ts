import { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  AllBusinessesInput,
  AllBusinessesSchema,
  FilterInput,
  LocationPriorityInput,
  SearchInput,
  SearchSchema,
} from "./db";

export const allBusinesses = async (_: unknown, args: AllBusinessesInput) => {
  const { page, limit } = AllBusinessesSchema.parse(args);

  const businesses = await prisma.business.findMany({
    where: { isEmailVerified: true, deletedAt: null },
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
    skip: (page - 1) * limit,
    take: limit,
  });

  if (!businesses) {
    throw new Error("Businesses not found!");
  }

  return businesses;
};

export const search = async (_: unknown, args: SearchInput) => {
  const { cityName, serviceName, page, limit, ...filters } =
    SearchSchema.parse(args);

  const locationInfo = await getLocationHierarchy(cityName);

  const baseConditions = {
    isListed: true,
    deletedAt: null,
    name: {
      contains: serviceName,
      mode: "insensitive",
    },
  };

  const services = await getServicesWithPriority(
    baseConditions,
    locationInfo,
    filters,
    page,
    limit
  );

  return services;
};

const getLocationHierarchy = async (cityName: string) => {
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
    cityId: city?.id,
    stateId: city?.state?.id,
    countryId: city?.state?.country?.id,
  };
};

const getServicesWithPriority = async (
  baseConditions: any,
  location: LocationPriorityInput,
  filters: FilterInput,
  page: number,
  limit: number
) => {
  const now = new Date();

  // Build the orderBy clause based on filters
  const orderBy = buildOrderByClause(filters);

  // Build additional where conditions based on filters
  const whereConditions = {
    ...baseConditions,
    ...(filters.verified && {
      business: {
        isBusinessVerified: true,
      },
    }),
    ...(filters.minPrice && { price: { gte: filters.minPrice } }),
    ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    ...(filters.minRating && { averageRating: { gte: filters.minRating } }),
  };

  // Fetch services with their business and address information
  const services = await prisma.service.findMany({
    where: whereConditions,
    include: {
      business: {
        include: {
          subscription: true,
          address: {
            include: {
              city: true,
              state: true,
              country: true,
            },
          },
        },
      },
      address: {
        include: {
          city: true,
          state: true,
          country: true,
        },
      },
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  // Sort services based on location priority and featured status
  return services.sort((a, b) => {
    // Location priority scoring
    const scoreA = getLocationScore(a, location);
    const scoreB = getLocationScore(b, location);

    if (scoreA !== scoreB) return scoreB - scoreA;

    // Featured status (has active subscription)
    const isFeatureA = isServiceFeatured(a, now);
    const isFeatureB = isServiceFeatured(b, now);
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
  service: any,
  location: LocationPriorityInput
): number => {
  const serviceCity =
    service.address?.cityId || service.business.address?.cityId;
  const serviceState =
    service.address?.stateId || service.business.address?.stateId;
  const serviceCountry =
    service.address?.countryId || service.business.address?.countryId;

  if (serviceCity === location.cityId) return 4;
  if (serviceState === location.stateId) return 3;
  if (serviceCountry === location.countryId) return 2;
  return 1;
};

const isServiceFeatured = (service: any, currentDate: Date): boolean => {
  return (
    service.business?.subscription?.id != null &&
    service.business?.subscriptionExpire != null &&
    service.business.subscriptionExpire > currentDate
  );
};

const buildOrderByClause = (
  filters: FilterInput
):
  | Prisma.ServiceOrderByWithRelationInput
  | Prisma.ServiceOrderByWithRelationInput[] => {
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

// export const searchFilter = async (_: unknown, args: SearchFilterInput) => {
//   const { location, name } = SearchFilterSchema.parse(args);

//   // Step 1: Find the city in the City table that matches the user's input
//   const city = await prisma.city.findFirst({
//     where: { name: { contains: location, mode: "insensitive" } },
//   });

//   if (!city) {
//     throw new Error("City not found!");
//   }

//   // Step 2: Find services in the found city with a name resembling the service name the user provided
//   const services = await prisma.service.findMany({
//     where: {
//       AND: [
//         { name: { contains: name, mode: "insensitive" } }, // Service name resembling the user's input
//         {
//           address: {
//             cityId: city.id, // Match the city by its ID
//           },
//         },
//       ],
//     },
//     orderBy: [
//       { averageRating: "desc" }, // Order by highest rating
//       { updatedAt: "desc" }, // Order by latest update
//     ],
//     include: {
//       business: {
//         select: {
//           name: true,
//           subscription: true,
//         },
//       },
//       address: true,
//     },
//   });

//   if (services.length === 0) {
//     throw new Error("No services found in the specified city!");
//   }

//   return services;
// };
