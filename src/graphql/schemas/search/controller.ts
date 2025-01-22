import { AdminNoticeType } from "@prisma/client";
import { prisma } from "../../../utils/dbConnect";
import {
  AllTestimonialsInput,
  GetAllAdminNoticesInput,
  GetAllAdminNoticesSchema,
  GetBusinessByIdInput,
  GetBusinessByIdSchema,
  LocationInput,
  LocationSchema,
} from "./db";

const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Max number of items in cache

export const getAllBusinesses = async () => {
  const cachedResult = getCachedResult("allBusinesses");

  if (cachedResult) return cachedResult;

  const allBusinesses = prisma.business.findMany({
    where: {
      // isListed: true,
      // isBlocked: false,
      deletedAt: null,
      primaryContacts: {
        some: {
          isVerified: true,
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
      price: true,
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
              order: "asc",
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
        orderBy: [{ rating: "desc" }, { updatedAt: "desc" }],
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
        take: 20,
      },
    },
  });

  setCachedResult("allBusinesses", allBusinesses);

  return allBusinesses;
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
        orderBy: [{ rating: "desc" }, { updatedAt: "desc" }],
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
        take: 20,
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
  const cachedResult = getCachedResult("allLanguages");

  if (cachedResult) return cachedResult;

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

  setCachedResult("allLanguages", allLanguages);

  return allLanguages;
};

export const allProficiencies = async () => {
  const cachedResult = getCachedResult("allProficiencies");

  if (cachedResult) return cachedResult;

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

  setCachedResult("allProficiencies", allProficiency);

  return allProficiency;
};

export const allCourts = async () => {
  const cachedResult = getCachedResult("allCourts");

  if (cachedResult) return cachedResult;

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

  setCachedResult("allCourts", allCourt);

  return allCourt;
};

export const allCategories = async () => {
  const cachedResult = getCachedResult("allCategories");

  if (cachedResult) return cachedResult;

  const allCategory = prisma.category.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      order: true,
      name: true,
      slug: true,
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
    orderBy: {
      order: "asc",
    },
  });

  setCachedResult("allCategories", allCategory);

  return allCategory;
};

export const allTags = async () => {
  const cachedResult = getCachedResult("allTags");

  if (cachedResult) return cachedResult;

  const allTag = prisma.tag.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  setCachedResult("allTags", allTag);

  return allTag;
};

export const location = async (_: unknown, args: LocationInput) => {
  const { search } = LocationSchema.parse(args);

  const cachedResult = getCachedResult(`location-${search}`);

  if (cachedResult) return cachedResult;

  // Run all queries in parallel using Promise.all
  const [pincodes, cities, states, countries] = await Promise.all([
    prisma.pincode.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
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
    }),
    prisma.city.findMany({
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
    }),
    prisma.state.findMany({
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
        countryId: true,
        country: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.country.findMany({
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
    }),
  ]);

  // Combine all results
  const results = {
    pincodes,
    cities,
    states,
    countries,
  };

  setCachedResult(`location-${search}`, results);

  return results;
};

export const allTestimonials = async (
  _: unknown,
  args: AllTestimonialsInput
) => {
  const { page, limit, type } = AllTestimonialsInput.parse(args);

  const cacheKey = JSON.stringify({ page, limit, type });

  const cachedResult = getCachedResult(`allTestimonials-${cacheKey}`);

  if (cachedResult) return cachedResult;

  const allTestimonials = prisma.testimonial.findMany({
    where: {
      deletedAt: null,
      type: type,
      order: {
        not: null,
      },
    },
    select: {
      id: true,
      type: true,
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
    orderBy: [{ order: "asc" }, { rating: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });

  setCachedResult(`allTestimonials-${cacheKey}`, allTestimonials);

  return allTestimonials;
};

export const getAllAddBanners = async () => {
  const cachedResult = getCachedResult("allAdBanners");

  if (cachedResult) return cachedResult;

  const allAdBanners = prisma.adminBusinessAdBannerImage.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      order: true,
      businessAdBannerImage: {
        select: {
          id: true,
          url: true,
          order: true,
          businessDetails: {
            select: {
              business: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  setCachedResult("allAdBanners", allAdBanners);

  return allAdBanners;
};

export const getAllMobileAddBanners = async () => {
  const cachedResult = getCachedResult("allMobileAdBanners");

  if (cachedResult) return cachedResult;

  const allMobileAdBanners = prisma.adminBusinessMobileAdBannerImage.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      order: true,
      businessMobileAdBannerImage: {
        select: {
          id: true,
          url: true,
          order: true,
          businessDetails: {
            select: {
              business: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  setCachedResult("allMobileAdBanners", allMobileAdBanners);

  return allMobileAdBanners;
};

export const getAllAdminNotices = async (
  _: unknown,
  args: GetAllAdminNoticesInput
) => {
  const validatedData = GetAllAdminNoticesSchema.parse(args);

  const types: AdminNoticeType[] =
    validatedData?.types && validatedData.types.length > 0
      ? validatedData.types
      : ["GLOBAL"];

  const cacheKey = `adminNotices:${types.join(",")}`;
  const cachedResult = getCachedResult(cacheKey);

  if (cachedResult) return cachedResult;

  const adminNotices = await prisma.adminNotice.findMany({
    where: {
      deletedAt: null,
      type: {
        in: types, // Allows filtering by the specified types
      },
      expiresAt: {
        gt: new Date(), // Filters for notices that have not expired
      },
    },
    select: {
      id: true,
      type: true,
      note: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  setCachedResult(cacheKey, adminNotices);

  return adminNotices;
};

export const getAllUserSubscriptions = async () => {
  const cachedResult = getCachedResult("userSubscriptions");

  if (cachedResult) return cachedResult;

  const userSubscriptions = await prisma.userSubscription.findMany({
    where: { deletedAt: null },
  });

  setCachedResult("userSubscriptions", userSubscriptions);

  return userSubscriptions;
};

export const getAllBusinessSubscriptions = async () => {
  const cachedResult = getCachedResult("businessSubscriptions");

  if (cachedResult) return cachedResult;

  const businessSubscriptions = await prisma.businessSubscription.findMany({
    where: { deletedAt: null },
  });

  setCachedResult("businessSubscriptions", businessSubscriptions);

  return businessSubscriptions;
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
