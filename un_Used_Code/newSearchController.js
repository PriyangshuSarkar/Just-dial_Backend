"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newSearch = void 0;
const dbConnect_1 = require("../../../utils/dbConnect");
const db_1 = require("./db");
const LOCATION_SCORES = {
    PINCODE: 5,
    CITY: 4,
    STATE: 3,
    COUNTRY: 2,
    DEFAULT: 1,
};
const DEFAULT_SELECT = {
    id: true,
    name: true,
    slug: true,
};
const ACTIVE_RECORD = {
    deletedAt: null,
};
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const newSearch = async (_, args) => {
    const { page = 1, limit = 10, ...filters } = db_1.SearchSchema.parse(args);
    const cacheKey = JSON.stringify({ page, limit, ...filters });
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult)
        return cachedResult;
    const result = await dbConnect_1.prisma.$transaction(async (tx) => {
        const [locationInfo, baseConditions] = await Promise.all([
            getLocationHierarchy({
                pincodeInput: filters.pincode,
                cityInput: filters.city,
                stateInput: filters.state,
                countryInput: filters.country,
            }, tx),
            buildBaseConditions(filters),
        ]);
        const results = await getBusinessWithPriority(baseConditions, locationInfo, filters, page, limit, tx);
        return results;
    });
    setCachedResult(cacheKey, result);
    return result;
};
exports.newSearch = newSearch;
const buildBaseConditions = (filters) => {
    const conditions = {
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
    if (filters.search) {
        conditions.name = {
            contains: filters.search,
            mode: "insensitive",
        };
    }
    if (filters.verified !== undefined ||
        filters.minRating ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined) {
        conditions.AND = [];
        if (filters.verified !== undefined) {
            conditions.AND.push({ isBusinessVerified: filters.verified });
        }
        if (filters.minRating) {
            conditions.AND.push({ averageRating: { gte: filters.minRating } });
        }
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            conditions.AND.push({
                price: {
                    ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
                    ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
                },
            });
        }
    }
    const businessDetailsConditions = buildBusinessDetailsConditions(filters);
    if (Object.keys(businessDetailsConditions).length > 0) {
        conditions.businessDetails = businessDetailsConditions;
    }
    return conditions;
};
const buildBusinessDetailsConditions = (filters) => {
    const conditions = {};
    if (filters.categoryId || filters.categorySlug) {
        conditions.categories = {
            some: {
                OR: [{ id: filters.categoryId }, { slug: filters.categorySlug }].filter(Boolean),
            },
        };
    }
    const arrayFilters = {
        languages: filters.languages,
        courts: filters.courts,
        proficiencies: filters.proficiencies,
    };
    const arrayConditions = Object.entries(arrayFilters)
        .filter(([, value]) => value?.length)
        .map(([key, value]) => ({
        [key]: {
            some: {
                name: { in: value, mode: "insensitive" },
            },
        },
    }));
    if (arrayConditions.length > 0) {
        conditions.AND = arrayConditions;
    }
    return conditions;
};
const getBusinessWithPriority = async (baseConditions, location, filters, page, limit, tx) => {
    const now = new Date();
    const skip = (page - 1) * limit;
    const select = buildSelectObject(location);
    const [businesses, total, categories] = await Promise.all([
        tx.business.findMany({
            where: baseConditions,
            select,
            orderBy: buildOrderByClause(filters),
            skip,
            take: limit,
        }),
        tx.business.count({ where: baseConditions }),
        getCategoriesForSearch(filters, tx),
    ]);
    const sortedBusinesses = businesses
        .map((business) => ({
        ...business,
        slug: business.slug || business.id,
        locationScore: getLocationScore(business, location),
        isFeatured: isBusinessFeatured(business, now),
    }))
        .sort((a, b) => {
        if (a.locationScore !== b.locationScore)
            return b.locationScore - a.locationScore;
        return b.isFeatured ? 1 : -1;
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
const getCachedResult = (key) => {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    requestCache.delete(key);
    return null;
};
const setCachedResult = (key, data) => {
    requestCache.set(key, {
        data,
        timestamp: Date.now(),
    });
};
const buildSelectObject = (location) => ({
    ...DEFAULT_SELECT,
    primaryContacts: {
        where: ACTIVE_RECORD,
        orderBy: { createdAt: "asc" },
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
        where: ACTIVE_RECORD,
        select: buildBusinessDetailsSelect(location),
    },
    reviews: {
        where: ACTIVE_RECORD,
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            rating: true,
            comment: true,
            businessId: true,
            userId: true,
        },
    },
    price: true,
});
const buildBusinessDetailsSelect = (location) => ({
    id: true,
    experience: true,
    teamSize: true,
    description: true,
    addresses: {
        where: {
            ...ACTIVE_RECORD,
            ...buildLocationFilter(location),
        },
    },
});
const buildLocationFilter = (location) => {
    const conditions = [];
    if (location.pincode)
        conditions.push({ pincode: { contains: location.pincode } });
    if (location.city)
        conditions.push({ city: { contains: location.city } });
    if (location.state)
        conditions.push({ state: { contains: location.state } });
    if (location.country)
        conditions.push({ country: { contains: location.country } });
    return conditions.length ? { OR: conditions } : {};
};
const getLocationHierarchy = async ({ pincodeInput, cityInput, stateInput, countryInput, }, tx) => {
    const [pincode, city, state, country] = await Promise.all([
        pincodeInput
            ? tx.pincode.findFirst({
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
            ? tx.city.findFirst({
                where: { name: { contains: cityInput, mode: "insensitive" } },
                include: {
                    state: {
                        include: { country: true },
                    },
                },
            })
            : null,
        stateInput
            ? tx.state.findFirst({
                where: { name: { contains: stateInput, mode: "insensitive" } },
                include: { country: true },
            })
            : null,
        countryInput
            ? tx.country.findFirst({
                where: { name: { contains: countryInput, mode: "insensitive" } },
            })
            : null,
    ]);
    return {
        pincode: pincode?.code,
        city: city?.name || pincode?.city?.name,
        state: state?.name || city?.state?.name || pincode?.city?.state?.name,
        country: country?.name ||
            state?.country?.name ||
            city?.state?.country?.name ||
            pincode?.city?.state?.country?.name,
    };
};
const getLocationScore = (business, location) => {
    const address = business.businessDetails?.addresses?.[0];
    if (!address)
        return LOCATION_SCORES.DEFAULT;
    if (location.pincode &&
        address.pincode?.toLowerCase() === location.pincode.toLowerCase()) {
        return LOCATION_SCORES.PINCODE;
    }
    if (location.city &&
        address.city?.toLowerCase() === location.city.toLowerCase()) {
        return LOCATION_SCORES.CITY;
    }
    if (location.state &&
        address.state?.toLowerCase() === location.state.toLowerCase()) {
        return LOCATION_SCORES.STATE;
    }
    if (location.country &&
        address.country?.toLowerCase() === location.country.toLowerCase()) {
        return LOCATION_SCORES.COUNTRY;
    }
    return LOCATION_SCORES.DEFAULT;
};
const getCategoriesForSearch = async (filters, tx) => {
    if (filters.categoryId || filters.categorySlug) {
        const category = await tx.category.findFirst({
            where: {
                AND: [
                    { id: filters.categoryId, ...ACTIVE_RECORD },
                    { slug: filters.categorySlug, ...ACTIVE_RECORD },
                ].filter(Boolean),
            },
        });
        return category ? [category] : [];
    }
    return tx.category.findMany({
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
    });
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
