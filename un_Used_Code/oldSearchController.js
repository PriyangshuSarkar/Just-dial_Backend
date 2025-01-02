"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldSearch = void 0;
const dbConnect_1 = require("../../../utils/dbConnect");
const db_1 = require("./db");
const oldSearch = async (_, args) => {
    const { page = 1, limit = 10, ...filters } = db_1.SearchSchema.parse(args);
    const locationInfo = await getLocationHierarchy({
        pincodeInput: filters.pincode,
        cityInput: filters.city,
        stateInput: filters.state,
        countryInput: filters.country,
    });
    const baseConditions = {
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
            categories: filters.categoryId || filters.categorySlug
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
            addresses: {
                some: {
                    deletedAt: null,
                    ...((locationInfo.pincode ||
                        locationInfo.city ||
                        locationInfo.state ||
                        locationInfo.country) && {
                        OR: [
                            ...(locationInfo.pincode
                                ? [{ pincode: { contains: locationInfo.pincode } }]
                                : []),
                            ...(locationInfo.city
                                ? [{ city: { contains: locationInfo.city } }]
                                : []),
                            ...(locationInfo.state
                                ? [{ state: { contains: locationInfo.state } }]
                                : []),
                            ...(locationInfo.country
                                ? [{ country: { contains: locationInfo.country } }]
                                : []),
                        ].filter(Boolean),
                    }),
                },
            },
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
    const result = await getBusinessWithPriority(baseConditions, locationInfo, filters, page, limit);
    return result;
};
exports.oldSearch = oldSearch;
const getBusinessWithPriority = async (baseConditions, location, filters, page, limit) => {
    const now = new Date();
    const orderBy = buildOrderByClause(filters);
    const whereConditions = {
        ...baseConditions,
    };
    const [businesses, total] = await dbConnect_1.prisma.$transaction([
        dbConnect_1.prisma.business.findMany({
            where: {
                ...whereConditions,
            },
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
                                ...((location.pincode ||
                                    location.city ||
                                    location.state ||
                                    location.country) && {
                                    OR: [
                                        ...(location.pincode
                                            ? [{ pincode: { contains: location.pincode } }]
                                            : []),
                                        ...(location.city
                                            ? [{ city: { contains: location.city } }]
                                            : []),
                                        ...(location.state
                                            ? [{ state: { contains: location.state } }]
                                            : []),
                                        ...(location.country
                                            ? [{ country: { contains: location.country } }]
                                            : []),
                                    ].filter(Boolean),
                                }),
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
        dbConnect_1.prisma.business.count({ where: whereConditions }),
    ]);
    const mappedBusinesses = businesses.map((business) => ({
        ...business,
        slug: business.slug || business.id,
    }));
    const sortedBusinesses = mappedBusinesses.sort((a, b) => {
        if (location.pincode ||
            location.city ||
            location.state ||
            location.country) {
            const scoreA = getLocationScore(a, location);
            const scoreB = getLocationScore(b, location);
            if (scoreA !== scoreB)
                return scoreB - scoreA;
        }
        const isFeatureA = isBusinessFeatured(a, now);
        const isFeatureB = isBusinessFeatured(b, now);
        if (isFeatureA !== isFeatureB)
            return isFeatureB ? 1 : -1;
        return 0;
    });
    const categories = filters.categoryId || filters.categorySlug
        ? await dbConnect_1.prisma.category
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
        : await dbConnect_1.prisma.category.findMany({
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
const getLocationHierarchy = async ({ pincodeInput, cityInput, stateInput, countryInput, }) => {
    const result = {
        pincode: undefined,
        city: undefined,
        state: undefined,
        country: undefined,
    };
    if (countryInput) {
        const country = await dbConnect_1.prisma.country.findFirst({
            where: {
                name: { contains: countryInput, mode: "insensitive" },
            },
        });
        if (country) {
            result.country = country.name || result.country;
        }
    }
    if (stateInput) {
        const state = await dbConnect_1.prisma.state.findFirst({
            where: {
                name: { contains: stateInput, mode: "insensitive" },
            },
            include: {
                country: true,
            },
        });
        if (state) {
            result.state = state.name || result.state;
            result.country = state.country?.name || result.country;
        }
    }
    if (cityInput) {
        const city = await dbConnect_1.prisma.city.findFirst({
            where: {
                name: { contains: cityInput, mode: "insensitive" },
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
            result.city = city.name || result.city;
            result.state = city.state?.name || result.state;
            result.country = city.state?.country?.name || result.country;
        }
    }
    if (!pincodeInput) {
        const pincode = await dbConnect_1.prisma.pincode.findFirst({
            where: {
                code: { contains: pincodeInput, mode: "insensitive" },
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
            result.pincode = pincode.code;
            result.city = pincode.city?.name;
            result.state = pincode.city?.state?.name;
            result.country = pincode.city?.state?.country?.name;
        }
    }
    return result;
};
const getLocationScore = (business, location) => {
    const businessAddresses = business.businessDetails?.addresses || [];
    if (!businessAddresses.length)
        return 1;
    const primaryAddress = businessAddresses[0];
    if (location.pincode &&
        primaryAddress.pincode?.toLowerCase() === location.pincode.toLowerCase()) {
        return 5;
    }
    if (location.city &&
        primaryAddress.city?.toLowerCase() === location.city.toLowerCase()) {
        return 4;
    }
    if (location.state &&
        primaryAddress.state?.toLowerCase() === location.state.toLowerCase()) {
        return 3;
    }
    if (location.country &&
        primaryAddress.country?.toLowerCase() === location.country.toLowerCase()) {
        return 2;
    }
    return 1;
};
const buildOrderByClause = (filters) => {
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
const isBusinessFeatured = (business, currentDate) => {
    return (business.subscription?.id != null &&
        business.subscriptionExpire != null &&
        business.subscriptionExpire > currentDate);
};
