import {
  object,
  string,
  infer as infer_,
  enum as enum_,
  number,
  boolean,
  any,
} from "zod";

export const AdminLoginSchema = object({
  email: string(),
  password: string(),
}).optional();
export type AdminLoginInput = infer_<typeof AdminLoginSchema>;

export const AdminChangePasswordSchema = object({
  password: string(),
}).optional();
export type AdminChangePasswordInput = infer_<typeof AdminChangePasswordSchema>;

export const AdminSearchAllReviewsSchema = object({
  search: string().toLowerCase().optional(),
  sortBy: enum_(["rating", "createdAt"]).default("createdAt"),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
}).optional();
export type AdminSearchAllReviewsInput = infer_<
  typeof AdminSearchAllReviewsSchema
>;

export const AdminDeleteReviewsSchema = object({
  reviews: object({
    reviewId: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminDeleteReviewsInput = infer_<typeof AdminDeleteReviewsSchema>;

export const AdminSearchAllFeedbacksSchema = object({
  search: string().toLowerCase().optional(),
  sortBy: enum_(["rating", "createdAt"]).default("createdAt"),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
}).optional();
export type AdminSearchAllFeedbacksInput = infer_<
  typeof AdminSearchAllFeedbacksSchema
>;

export const AdminGetUserByIdSchema = object({
  userId: string().optional(),
  userSlug: string().optional(),
})
  .refine((data) => data.userSlug || data.userId, {
    message: "Either userSlug or userId must be provided.",
    path: ["userSlug", "userId "], // Pointing to both fields for clarity
  })
  .optional();
export type AdminGetUserByIdInput = infer_<typeof AdminGetUserByIdSchema>;

export const AdminAllUsersSchema = object({
  name: string().optional(),
  email: string().optional(),
  phone: string().optional(),
  subscriptionId: string().optional(),
  hasSubscription: boolean().optional(),
  isVerified: boolean().optional(),
  createdAtStart: string().datetime().optional(),
  createdAtEnd: string().datetime().optional(),
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
  sortBy: enum_(["alphabetical", "createdAt", "updatedAt"]).default(
    "createdAt"
  ),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminAllUsersInput = infer_<typeof AdminAllUsersSchema>;

export const AdminGetBusinessByIdSchema = object({
  businessId: string().optional(),
  businessSlug: string().optional(),
})
  .refine((data) => data.businessId || data.businessSlug, {
    message: "Either businessSlug or businessId must be provided.",
    path: ["businessSlug", "businessId"], // Pointing to both fields for clarity
  })
  .optional();
export type AdminGetBusinessByIdInput = infer_<
  typeof AdminGetBusinessByIdSchema
>;

export const AdminAllBusinessesSchema = object({
  name: string().optional(),
  email: string().optional(),
  phone: string().optional(),
  isBusinessVerified: boolean().optional(),
  subscriptionId: string().optional(),
  hasSubscription: boolean().optional(),
  categoryId: string().optional(),
  averageRatingMin: number().min(0).max(5).optional(),
  averageRatingMax: number().min(0).max(5).optional(),
  isListed: boolean().optional(),
  createdAtStart: string().datetime().optional(),
  createdAtEnd: string().datetime().optional(),
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
  sortBy: enum_([
    "alphabetical",
    "updatedAt",
    "createdAt",
    "averageRating",
    "reviewCount",
  ]).default("createdAt"),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminAllBusinessesInput = infer_<typeof AdminAllBusinessesSchema>;

export const AdminVerifyBusinessesSchema = object({
  businesses: object({
    businessSlug: string().optional(),
    businessId: string().optional(),
    verify: boolean(),
  })
    .refine((data) => data.businessSlug || data.businessId, {
      message: "Either businessSlug or businessId must be provided.",
      path: ["businessSlug", "businessId"], // Pointing to both fields for clarity
    })
    .array()
    .optional(),
}).optional();
export type AdminVerifyBusinessesInput = infer_<
  typeof AdminVerifyBusinessesSchema
>;

export const AdminBlockBusinessesSchema = object({
  businesses: object({
    businessSlug: string().optional(),
    businessId: string().optional(),
    block: boolean(),
  })
    .refine((data) => data.businessSlug || data.businessId, {
      message: "Either businessSlug or businessId must be provided.",
      path: ["businessSlug", "businessId"], // Pointing to both fields for clarity
    })
    .array()
    .optional(),
}).optional();
export type AdminBlockBusinessesInput = infer_<
  typeof AdminBlockBusinessesSchema
>;

export const AdminBlockUsersSchema = object({
  users: object({
    userSlug: string().optional(),
    userId: string().optional(),
    block: boolean(),
  })
    .refine((data) => data.userSlug || data.userId, {
      message: "Either userSlug or userId must be provided.",
      path: ["userSlug", "userId "], // Pointing to both fields for clarity
    })
    .array()
    .optional(),
}).optional();
export type AdminBlockUsersInput = infer_<typeof AdminBlockUsersSchema>;

export const AdminManageUserSubscriptionsSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  toDelete: boolean().optional().default(false),
}).optional();
export type AdminManageUserSubscriptionsInput = infer_<
  typeof AdminManageUserSubscriptionsSchema
>;

export const AdminManageBusinessSubscriptionsSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  tierLevel: number().optional(),
  toDelete: boolean().optional().default(false),
}).optional();
export type AdminManageBusinessSubscriptionsInput = infer_<
  typeof AdminManageBusinessSubscriptionsSchema
>;

export const AdminManageLanguagesSchema = object({
  languages: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageLanguagesInput = infer_<
  typeof AdminManageLanguagesSchema
>;

export const AdminManageProficienciesSchema = object({
  proficiencies: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageProficienciesInput = infer_<
  typeof AdminManageProficienciesSchema
>;

export const AdminManageCourtsSchema = object({
  courts: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCourtsInput = infer_<typeof AdminManageCourtsSchema>;

export const AdminManageCategoriesSchema = object({
  categories: object({
    id: string().optional(),
    name: string().optional(),
    order: number().optional(),
    description: string().optional(),
    slug: string().optional(),
    categoryImage: any().optional(),
    groupName: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCategoriesInput = infer_<
  typeof AdminManageCategoriesSchema
>;

export const AdminManageTagsSchema = object({
  tags: object({
    id: string().optional(),
    name: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageTagsInput = infer_<typeof AdminManageTagsSchema>;

export const AdminManageCountriesSchema = object({
  countries: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCountriesInput = infer_<
  typeof AdminManageCountriesSchema
>;

export const AdminManageStatesSchema = object({
  states: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    countryId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageStatesInput = infer_<typeof AdminManageStatesSchema>;

export const AdminManageCitiesSchema = object({
  cities: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    stateId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCitiesInput = infer_<typeof AdminManageCitiesSchema>;

export const AdminManagePincodesSchema = object({
  pincodes: object({
    id: string().optional(),
    code: string(),
    slug: string().optional(),
    cityId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManagePincodesInput = infer_<typeof AdminManagePincodesSchema>;

export const AdminGetAllTestimonialsSchema = object({
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
  type: enum_(["REVIEW", "FEEDBACK"]).optional(),
  sortBy: enum_(["alphabetical", "createdAt", "updatedAt"]).default(
    "createdAt"
  ),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminGetAllTestimonialsInput = infer_<
  typeof AdminGetAllTestimonialsSchema
>;

export const AdminManageTestimonialsSchema = object({
  testimonials: object({
    id: string().optional(),
    reviewId: string().optional(),
    feedbackId: string().optional(),
    order: number().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageTestimonialsInput = infer_<
  typeof AdminManageTestimonialsSchema
>;

export const AdminGetAllAdminNoticesSchema = object({
  type: enum_([
    "GLOBAL",
    "ALL_USER",
    "ALL_BUSINESS",
    "INDIVIDUAL_USER",
    "INDIVIDUAL_BUSINESS",
  ]).optional(),
  page: number().int().positive().default(1),
  limit: number().int().positive().default(10),
  sortBy: enum_(["alphabetical", "createdAt", "updatedAt"]).default(
    "createdAt"
  ),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminGetAllAdminNoticesInput = infer_<
  typeof AdminGetAllAdminNoticesSchema
>;

export const AdminManageAdminNoticesSchema = object({
  adminNotices: object({
    id: string().optional(),
    businessId: string().optional(),
    businessSlug: string().optional(),
    userId: string().optional(),
    userSlug: string().optional(),
    type: enum_([
      "GLOBAL",
      "ALL_USER",
      "ALL_BUSINESS",
      "INDIVIDUAL_USER",
      "INDIVIDUAL_BUSINESS",
    ]).optional(),
    note: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageAdminNoticesInput = infer_<
  typeof AdminManageAdminNoticesSchema
>;
