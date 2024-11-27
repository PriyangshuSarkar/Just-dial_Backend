import { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  AreaInput,
  AreaSchema,
  FilterInput,
  GetBusinessByIdInput,
  GetBusinessByIdSchema,
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

  // Get location info only if cityName is provided
  const locationInfo = cityName
    ? await getLocationHierarchy(cityName)
    : { city: null, state: null, country: null };

  const baseConditions: Prisma.BusinessWhereInput = {
    isListed: true,
    deletedAt: null,
    isBlocked: false,
    ...(businessName && {
      name: {
        contains: businessName,
        mode: "insensitive",
      },
    }),
  };

  const result = await getBusinessWithPriority(
    baseConditions,
    locationInfo,
    filters,
    page,
    limit
  );

  return result;
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
    // ... rest of your where conditions remain the same
  };

  // Fetch businesses and total count in parallel
  const [businesses, total] = await prisma.$transaction([
    prisma.business.findMany({
      where: whereConditions,
      include: {
        businessDetails: {
          include: {
            addresses: true,
            languages: true,
            courts: true,
            proficiencies: true,
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
    }),
    prisma.business.count({ where: whereConditions }),
  ]);

  // Sort businesses based on location priority and featured status
  const sortedBusinesses = businesses.sort((a, b) => {
    if (location.city || location.state || location.country) {
      const scoreA = getLocationScore(a, location);
      const scoreB = getLocationScore(b, location);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    const isFeatureA = isBusinessFeatured(a, now);
    const isFeatureB = isBusinessFeatured(b, now);
    if (isFeatureA !== isFeatureB) return isFeatureB ? 1 : -1;

    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    if (ratingA !== ratingB) return ratingB - ratingA;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return {
    businesses: sortedBusinesses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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

export const getBusinessById = async (
  _: unknown,
  args: GetBusinessByIdInput
) => {
  const validatedData = GetBusinessByIdSchema.parse(args);

  const business = await prisma.business.findFirst({
    where: {
      id: validatedData.businessId,
      deletedAt: null,
      isListed: true,
      isBlocked: false,
      primaryContacts: {
        some: {
          isVerified: true,
          deletedAt: null,
        },
      },
    },
    include: {
      // primaryContacts: true,
      businessDetails: {
        include: {
          addresses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          websites: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          courts: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          proficiencies: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          languages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          tags: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      // businessSupportingDocuments: {
      //   where: {
      //     deletedAt: null,
      //   },
      //   orderBy: {
      //     createdAt: "desc",
      //   },
      // },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      // subscription: {
      //   where: {
      //     deletedAt: null,
      //   },
      // },
      // bookings: {
      //   where: {
      //     deletedAt: null,
      //   },
      //   orderBy: {
      //     createdAt: "desc",
      //   },
      // },
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }
  const {
    /* eslint-disable */
    // Code block where all ESLint rules are disabled
    password,
    salt,
    subscriptionId,
    subscriptionExpire,
    paymentVerification,
    razorpay_order_id,
    // More code here
    /* eslint-enable */
    ...restOfBusiness
  } = business;

  return {
    ...restOfBusiness,
  };
};

export const allLanguages = async () => {
  const allLanguages = prisma.language.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    ...allLanguages,
  };
};

export const allProficiencies = async () => {
  const allProficiency = prisma.proficiency.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    ...allProficiency,
  };
};

export const allCourts = async () => {
  const allCourt = prisma.court.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    ...allCourt,
  };
};

export const allCategories = async () => {
  const allCategory = prisma.category.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    ...allCategory,
  };
};

export const allTags = async () => {
  const allTag = prisma.tag.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    ...allTag,
  };
};

export const areas = async (_: unknown, args: AreaInput) => {
  const { search } = AreaSchema.parse(args);
  const results = await prisma.pincode.findMany({
    where: {
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        {
          city: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              {
                state: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                    {
                      country: {
                        OR: [
                          { name: { contains: search, mode: "insensitive" } },
                          { slug: { contains: search, mode: "insensitive" } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    include: {
      city: {
        include: {
          state: {
            include: {
              country: true,
            },
          },
        },
      },
    },
  });

  return {
    ...results,
  };
};
