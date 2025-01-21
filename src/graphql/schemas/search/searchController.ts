import { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  FilterInput,
  LocationPriorityInput,
  SearchInput,
  SearchSchema,
} from "./db";

// Cache frequently used values
const LOCATION_SCORES = {
  PINCODE: 5,
  CITY: 4,
  STATE: 3,
  COUNTRY: 2,
  DEFAULT: 1,
} as const;

// const DEFAULT_SELECT = {
//   id: true,
//   name: true,
//   slug: true,
// } as const;

const ACTIVE_RECORD = {
  deletedAt: null,
} as const;

// Implement request caching
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Max number of items in cache

export const search = async (_: unknown, args: SearchInput) => {
  const { page = 1, limit = 10, ...filters } = SearchSchema.parse(args);

  // Generate cache key based on search parameters
  const cacheKey = JSON.stringify({ page, limit, ...filters });

  // Check cache first
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) return cachedResult;

  // Parallelize location and base conditions
  const [locationInfo, baseConditions] = await Promise.all([
    getLocationHierarchy({
      pincodeInput: filters.pincode,
      cityInput: filters.city,
      stateInput: filters.state,
      countryInput: filters.country,
    }),
    buildBaseConditions(filters),
  ]);

  const result = getBusinessWithPriority(
    baseConditions,
    locationInfo,
    filters,
    page,
    limit
  );

  setCachedResult(cacheKey, result);
  return result;
};

const buildBaseConditions = (
  filters: FilterInput
): Prisma.BusinessWhereInput => {
  const conditions: Prisma.BusinessWhereInput = {
    ...ACTIVE_RECORD,
    isListed: true,
    isBlocked: false,
    primaryContacts: {
      some: {
        ...ACTIVE_RECORD,
        isVerified: true,
      },
    },
  };

  // Add optional filters
  if (filters.search) {
    conditions.name = {
      contains: filters.search,
      mode: "insensitive",
    };
  }

  if (filters.verified !== undefined) {
    conditions.isBusinessVerified = filters.verified;
  }

  // Build business details conditions
  const businessDetailsConditions: any = {};

  if (filters.categoryId || filters.categorySlug) {
    businessDetailsConditions.categories = {
      some: {
        OR: [{ id: filters.categoryId }, { slug: filters.categorySlug }].filter(
          Boolean
        ),
      },
    };
  }

  // Add array-based filters
  const arrayFilters = {
    languages: filters.languages,
    courts: filters.courts,
    proficiencies: filters.proficiencies,
  };

  Object.entries(arrayFilters).forEach(([key, value]) => {
    if (value?.length) {
      businessDetailsConditions[key] = {
        some: {
          name: { in: value, mode: "insensitive" },
        },
      };
    }
  });

  conditions.businessDetails = businessDetailsConditions;

  // Add price range if specified
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    conditions.price = {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
    };
  }

  // Add rating filter if specified
  if (filters.minRating) {
    conditions.averageRating = { gte: filters.minRating };
  }

  return conditions;
};

const getBusinessWithPriority = async (
  baseConditions: Prisma.BusinessWhereInput,
  location: LocationPriorityInput,
  filters: FilterInput,
  page: number,
  limit: number
) => {
  const now = new Date();
  const skip = (page - 1) * limit;

  // Build select object for optimization
  const select = buildSelectObject(location);

  // Parallel query execution
  const [businesses, total, categories] = await Promise.all([
    prisma.business.findMany({
      where: baseConditions,
      select,
      orderBy: buildOrderByClause(filters),
      skip,
      take: limit,
    }),
    prisma.business.count({ where: baseConditions }),
    getCategoriesForSearch(filters),
  ]);

  const mappedBusinesses = businesses.map((business) => ({
    ...business,
    slug: business.slug || business.id,
  }));

  const sortedBusinesses = sortBusinessesByPriority(
    mappedBusinesses,
    location,
    now
  );

  return {
    businesses: sortedBusinesses,
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const buildSelectObject = (
  location: LocationPriorityInput
): Prisma.BusinessSelect => ({
  id: true,
  name: true,
  slug: true,
  isBusinessVerified: true,
  primaryContacts: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      value: true,
      type: true,
    },
  },
  additionalContacts: true,
  type: true,
  averageRating: true,
  reviewCount: true,
  price: true,
  businessDetails: {
    where: ACTIVE_RECORD,
    select: buildBusinessDetailsSelect(location),
  },
  reviews: {
    where: ACTIVE_RECORD,
    orderBy: [{ rating: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      rating: true,
      comment: true,
      businessId: true,
      userId: true,
    },
    take: 20,
  },
});

const buildBusinessDetailsSelect = (location: LocationPriorityInput) => ({
  id: true,
  experience: true,
  teamSize: true,
  logo: true,
  description: true,
  addresses: {
    where: {
      ...ACTIVE_RECORD,
      ...buildLocationFilter(location),
    },
  },
  coverImages: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      order: true,
    },
  },
  categories: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryImage: true,
      categoryGroupNameId: true,
      groupName: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  },
  // Add other business detail selects...
  // (keeping the rest of your existing select structure)
});

const buildLocationFilter = (location: LocationPriorityInput) => {
  const conditions = [];

  if (location.pincode)
    conditions.push({ pincode: { contains: location.pincode } });
  if (location.city) conditions.push({ city: { contains: location.city } });
  if (location.state) conditions.push({ state: { contains: location.state } });
  if (location.country)
    conditions.push({ country: { contains: location.country } });

  return conditions.length ? { OR: conditions } : {};
};

const getLocationHierarchy = async ({
  pincodeInput,
  cityInput,
  stateInput,
  countryInput,
}: {
  pincodeInput?: string;
  cityInput?: string;
  stateInput?: string;
  countryInput?: string;
}): Promise<LocationPriorityInput> => {
  // Parallelize location queries
  const [pincode, city, state, country] = await Promise.all([
    pincodeInput
      ? prisma.pincode.findFirst({
          where: { code: { contains: pincodeInput, mode: "insensitive" } },
          include: {
            city: {
              include: {
                state: {
                  include: { country: true },
                },
              },
            },
          },
        })
      : null,
    cityInput
      ? prisma.city.findFirst({
          where: { name: { contains: cityInput, mode: "insensitive" } },
          include: {
            state: {
              include: { country: true },
            },
          },
        })
      : null,
    stateInput
      ? prisma.state.findFirst({
          where: { name: { contains: stateInput, mode: "insensitive" } },
          include: { country: true },
        })
      : null,
    countryInput
      ? prisma.country.findFirst({
          where: { name: { contains: countryInput, mode: "insensitive" } },
        })
      : null,
  ]);

  return {
    pincode: pincode?.code,
    city: city?.name || pincode?.city?.name,
    state: state?.name || city?.state?.name || pincode?.city?.state?.name,
    country:
      country?.name ||
      state?.country?.name ||
      city?.state?.country?.name ||
      pincode?.city?.state?.country?.name,
  };
};

const getLocationScore = (
  business: any,
  location: LocationPriorityInput
): number => {
  const address = business.businessDetails?.addresses?.[0];
  if (!address) return LOCATION_SCORES.DEFAULT;

  if (
    location.pincode &&
    address.pincode?.toLowerCase() === location.pincode.toLowerCase()
  ) {
    return LOCATION_SCORES.PINCODE;
  }
  if (
    location.city &&
    address.city?.toLowerCase() === location.city.toLowerCase()
  ) {
    return LOCATION_SCORES.CITY;
  }
  if (
    location.state &&
    address.state?.toLowerCase() === location.state.toLowerCase()
  ) {
    return LOCATION_SCORES.STATE;
  }
  if (
    location.country &&
    address.country?.toLowerCase() === location.country.toLowerCase()
  ) {
    return LOCATION_SCORES.COUNTRY;
  }
  return LOCATION_SCORES.DEFAULT;
};

const sortBusinessesByPriority = (
  businesses: any[],
  location: LocationPriorityInput,
  currentDate: Date
): any[] => {
  return businesses.sort((a, b) => {
    if (Object.values(location).some(Boolean)) {
      const scoreA = getLocationScore(a, location);
      const scoreB = getLocationScore(b, location);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    const isFeatureA = isBusinessFeatured(a, currentDate);
    const isFeatureB = isBusinessFeatured(b, currentDate);
    if (isFeatureA !== isFeatureB) {
      return isFeatureB ? 1 : -1;
    }

    return 0;
  });
};

const getCategoriesForSearch = async (filters: FilterInput) => {
  if (filters.categoryId || filters.categorySlug) {
    return prisma.category
      .findFirst({
        where: {
          AND: [
            { id: filters.categoryId, ...ACTIVE_RECORD },
            { slug: filters.categorySlug, ...ACTIVE_RECORD },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
          description: true,
          categoryImage: true,
          categoryGroupNameId: true,
          groupName: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      })
      .then((category) => (category ? [category] : null));
  } else {
    return prisma.category.findMany({
      where: {
        OR: [
          {
            name: { contains: filters.search, mode: "insensitive" },
            ...ACTIVE_RECORD,
          },
          {
            slug: { contains: filters.search, mode: "insensitive" },
            ...ACTIVE_RECORD,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        description: true,
        categoryImage: true,
        categoryGroupNameId: true,
        groupName: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });
  }

  return null;
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
    case "experience":
      return { businessDetails: { experience: filters.order || "desc" } };
    case "popularity":
      return [
        { reviewCount: filters.order || "desc" },
        { averageRating: "desc" },
      ];
    default:
      return [{ updatedAt: "desc" }];
  }
};

const isBusinessFeatured = (business: any, currentDate: Date): boolean => {
  return (
    business.subscription?.id != null &&
    business.subscriptionExpire != null &&
    business.subscriptionExpire > currentDate
  );
};

const getCachedResult = (key: string) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Move the cached item to the end to mark it as recently used
    requestCache.delete(key);
    requestCache.set(key, cached);
    return cached.data;
  }
  requestCache.delete(key);
  return null;
};

const setCachedResult = (key: string, data: any) => {
  if (requestCache.size >= MAX_CACHE_SIZE) {
    // Remove the first (least recently used) entry
    const firstKey = requestCache.keys().next().value;
    requestCache.delete(firstKey);
  }

  requestCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};
