import { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  FilterInput,
  GetBusinessByIdInput,
  GetBusinessByIdSchema,
  LocationInput,
  LocationPriorityInput,
  LocationSchema,
  SearchInput,
  SearchSchema,
} from "./db";

export const search = async (_: unknown, args: SearchInput) => {
  const { page = 1, limit = 10, ...filters } = SearchSchema.parse(args);

  // Get location info only if cityName is provided
  const locationInfo = await getLocationHierarchy({
    pincodeInput: filters.pincode,
    cityInput: filters.city,
    stateInput: filters.state,
    countryInput: filters.country,
  });

  const baseConditions: Prisma.BusinessWhereInput = {
    isListed: true,
    deletedAt: null,
    isBlocked: false,
    primaryContacts: {
      some: {
        isVerified: true,
        deletedAt: null,
      },
    },
    name: filters.search
      ? {
          contains: filters.search,
          mode: "insensitive",
        }
      : undefined,
    isBusinessVerified: filters.verified,
    businessDetails: {
      categories:
        filters.categoryId || filters.categorySlug
          ? {
              some: {
                OR: [
                  { id: filters.categoryId },
                  { slug: filters.categorySlug },
                ],
              },
            }
          : undefined,
      languages: filters.languages?.length
        ? {
            some: {
              name: {
                in: filters.languages,
              },
            },
          }
        : undefined,
      courts: filters.courts?.length
        ? {
            some: {
              name: {
                in: filters.courts,
              },
            },
          }
        : undefined,
      proficiencies: filters.proficiencies?.length
        ? {
            some: {
              name: {
                in: filters.proficiencies,
              },
            },
          }
        : undefined,
      // minPrice: filters.minPrice ? { gte: filters.minPrice } : undefined,
      // maxPrice: filters.maxPrice ? { lte: filters.maxPrice } : undefined,
      // minRating: filters.minRating ? { gte: filters.minRating } : undefined,
    },
    price: {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    },
    averageRating: filters.minRating
      ? {
          gte: filters.minRating,
        }
      : undefined,
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
  const result: {
    pincode: string[];
    city: string[];
    state: string[];
    country: string[];
  } = {
    pincode: [],
    city: [],
    state: [],
    country: [],
  };

  // Helper function to push values if they exist
  const pushIfExists = (arr: string[], value?: string) => {
    if (value) arr.push(value);
  };

  const pincode = await prisma.pincode.findFirst({
    where: {
      code: { equals: pincodeInput, mode: "insensitive" },
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

  if (pincode) {
    pushIfExists(result.pincode, pincode.code);
    pushIfExists(result.city, pincode.city?.name);
    pushIfExists(result.state, pincode.city?.state?.name);
    pushIfExists(result.country, pincode.city?.state?.country?.name);
  }

  const city = await prisma.city.findFirst({
    where: {
      name: { equals: cityInput, mode: "insensitive" },
    },
    include: {
      state: {
        include: {
          country: true,
        },
      },
    },
  });

  if (city) {
    pushIfExists(result.city, city.name);
    pushIfExists(result.state, city.state?.name);
    pushIfExists(result.country, city.state?.country?.name);
  }

  const state = await prisma.state.findFirst({
    where: {
      name: { equals: stateInput, mode: "insensitive" },
    },
    include: {
      country: true,
    },
  });

  if (state) {
    pushIfExists(result.state, state.name);
    pushIfExists(result.country, state.country?.name);
  }

  const country = await prisma.country.findFirst({
    where: {
      name: { equals: countryInput, mode: "insensitive" },
    },
  });

  if (country) {
    pushIfExists(result.country, country.name);
  }

  return result;
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
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
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
        businessDetails: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            experience: true,
            teamSize: true,
            description: true,
            updatedAt: true,
            addresses: {
              where: {
                deletedAt: null,
                OR: [
                  ...(location.pincode && location.pincode.length > 0
                    ? [
                        {
                          pincode: {
                            in: location.pincode, // Checks if any value in the city array matches
                            mode: Prisma.QueryMode.insensitive, // Corrected type
                          },
                        },
                      ]
                    : []),
                  ...(location.city && location.city.length > 0
                    ? [
                        {
                          city: {
                            in: location.city, // Checks if any value in the city array matches
                            mode: Prisma.QueryMode.insensitive, // Corrected type
                          },
                        },
                      ]
                    : []),
                  ...(location.state && location.state.length > 0
                    ? [
                        {
                          state: {
                            in: location.state, // Checks if any value in the state array matches
                            mode: Prisma.QueryMode.insensitive, // Corrected type
                          },
                        },
                      ]
                    : []),
                  ...(location.country && location.country.length > 0
                    ? [
                        {
                          country: {
                            in: location.country, // Checks if any value in the country array matches
                            mode: Prisma.QueryMode.insensitive, // Corrected type
                          },
                        },
                      ]
                    : []),
                ],
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                pincode: true,
                city: true,
                state: true,
                country: true,
                order: true,
              },
            },
            websites: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                type: true,
                url: true,
              },
            },
            coverImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                url: true,
                order: true,
              },
            },
            adBannerImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                url: true,
                order: true,
              },
            },
            mobileAdBannerImages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                url: true,
                order: true,
              },
            },
            operatingHours: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                dayOfWeek: true,
                openingTime: true,
                closingTime: true,
              },
            },
            latitude: true,
            longitude: true,
            degrees: true,
            languages: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            proficiencies: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            courts: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            categories: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            tags: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                name: true,
              },
            },
            logo: true,
          },
        },
        reviews: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            businessId: true,
            userId: true,
          },
        },
        price: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.business.count({ where: whereConditions }),
  ]);

  // Map businesses to include slug fallback
  const mappedBusinesses = businesses.map((business) => ({
    ...business,
    slug: business.slug || business.id,
  }));

  // Sort businesses based on location priority and featured status
  const sortedBusinesses = mappedBusinesses.sort((a, b) => {
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

  const categories =
    filters.categoryId || filters.categorySlug
      ? await prisma.category
          .findFirst({
            where: {
              AND: [
                {
                  id: filters.categoryId,
                  deletedAt: null,
                },
                {
                  slug: filters.categorySlug,
                  deletedAt: null,
                },
              ],
            },
          })
          .then((category) => (category ? [category] : null))
      : await prisma.category.findMany({
          where: {
            OR: [
              {
                name: { contains: filters.search, mode: "insensitive" },
                deletedAt: null,
              },
              {
                slug: { contains: filters.search, mode: "insensitive" },
                deletedAt: null,
              },
            ],
          },
        });

  return {
    businesses: sortedBusinesses,
    categories,
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
  if (
    location.pincode?.some(
      (p) => p.toLowerCase() === primaryAddress.pincode.toLowerCase()
    )
  ) {
    return 5;
  }
  if (
    location.city?.some(
      (c) => c.toLowerCase() === primaryAddress.city.toLowerCase()
    )
  ) {
    return 4;
  }
  if (
    location.state?.some(
      (s) => s.toLowerCase() === primaryAddress.state.toLowerCase()
    )
  ) {
    return 3;
  }
  if (
    location.country?.some(
      (c) => c.toLowerCase() === primaryAddress.country.toLowerCase()
    )
  ) {
    return 2;
  }
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

export const getBusinessById = async (
  _: unknown,
  args: GetBusinessByIdInput
) => {
  const validatedData = GetBusinessByIdSchema.parse(args);

  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { slug: validatedData.businessSlug },
        { id: validatedData.businessId },
      ],
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
    select: {
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
      businessDetails: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          experience: true,
          license: true,
          teamSize: true,
          description: true,
          primaryWebsite: true,
          addresses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              pincode: true,
              city: true,
              state: true,
              country: true,
              order: true,
            },
          },
          websites: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              type: true,
              url: true,
            },
          },
          coverImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
          adBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
          mobileAdBannerImages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
          operatingHours: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              dayOfWeek: true,
              openingTime: true,
              closingTime: true,
            },
          },
          latitude: true,
          longitude: true,
          degrees: true,
          languages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          proficiencies: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          courts: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          categories: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          },
          logo: true,
        },
      },
      reviews: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          businessId: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
            },
          },
        },
      },
      price: true,
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  if (!business?.slug) {
    business.slug = business.id;
  }

  return business;
};

export const allLanguages = async () => {
  const allLanguages = prisma.language.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return allLanguages;
};

export const allProficiencies = async () => {
  const allProficiency = prisma.proficiency.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return allProficiency;
};

export const allCourts = async () => {
  const allCourt = prisma.court.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return allCourt;
};

export const allCategories = async () => {
  const allCategory = prisma.category.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return allCategory;
};

export const allTags = async () => {
  const allTag = prisma.tag.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return allTag;
};

export const location = async (_: unknown, args: LocationInput) => {
  const { search } = LocationSchema.parse(args);

  // Fetch pincodes
  const pincodes = await prisma.pincode.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            // {
            //   city: {
            //     OR: [
            //       { name: { contains: search, mode: "insensitive" } },
            //       { slug: { contains: search, mode: "insensitive" } },
            //       {
            //         state: {
            //           OR: [
            //             { name: { contains: search, mode: "insensitive" } },
            //             { slug: { contains: search, mode: "insensitive" } },
            //             {
            //               country: {
            //                 OR: [
            //                   {
            //                     name: { contains: search, mode: "insensitive" },
            //                   },
            //                   {
            //                     slug: { contains: search, mode: "insensitive" },
            //                   },
            //                 ],
            //               },
            //             },
            //           ],
            //         },
            //       },
            //     ],
            //   },
            // },
          ],
        }
      : {},
    select: {
      id: true,
      code: true,
      slug: true,
      cityId: true,
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
          stateId: true,
          state: {
            select: {
              id: true,
              name: true,
              slug: true,
              countryId: true,
              country: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Fetch cities
  const cities = await prisma.city.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            // {
            //   state: {
            //     OR: [
            //       { name: { contains: search, mode: "insensitive" } },
            //       { slug: { contains: search, mode: "insensitive" } },
            //       {
            //         country: {
            //           OR: [
            //             { name: { contains: search, mode: "insensitive" } },
            //             { slug: { contains: search, mode: "insensitive" } },
            //           ],
            //         },
            //       },
            //     ],
            //   },
            // },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      slug: true,
      stateId: true,
      state: {
        select: {
          id: true,
          name: true,
          slug: true,
          countryId: true,
          country: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Fetch states
  const states = await prisma.state.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            // {
            //   country: {
            //     OR: [
            //       { name: { contains: search, mode: "insensitive" } },
            //       { slug: { contains: search, mode: "insensitive" } },
            //     ],
            //   },
            // },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      slug: true,
      countryId: true,
      country: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Fetch countries
  const countries = await prisma.country.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Combine all results
  const results = {
    pincodes,
    cities,
    states,
    countries,
  };

  console.log(results);

  return results;
};

export const allTestimonials = async () => {
  const allTestimonials = prisma.testimonial.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      rating: true,
      reviewId: true,
      feedbackId: true,
      comment: true,
      userId: true,
      businessId: true,
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return allTestimonials;
};

export const getAllAddBanners = async () => {
  const allAdBanners = prisma.businessAdBannerImage.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      order: true,
      businessDetails: {
        select: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return allAdBanners;
};

export const getAllMobileAddBanners = async () => {
  const allMobileAdBanners = prisma.businessMobileAdBannerImage.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      order: true,
      businessDetails: {
        select: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return allMobileAdBanners;
};
