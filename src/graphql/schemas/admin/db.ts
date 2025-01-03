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
  sortBy: enum_(["name", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminAllUserInput = infer_<typeof AdminAllUsersSchema>;

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
  sortBy: enum_(["name", "createdAt", "averageRating", "reviewCount"]).default(
    "createdAt"
  ),
  sortOrder: enum_(["asc", "desc"]).default("desc"),
}).optional();
export type AdminAllBusinessesInput = infer_<typeof AdminAllBusinessesSchema>;

export const AdminVerifyBusinessesSchema = object({
  businessIds: string().array().optional(),
});
export type AdminVerifyBusinessesInput = infer_<
  typeof AdminVerifyBusinessesSchema
>;

export const AdminBlockBusinessesSchema = object({
  businessIds: string().array(),
}).optional();
export type AdminBlockBusinessesInput = infer_<
  typeof AdminBlockBusinessesSchema
>;

export const AdminBlockUserSchema = object({
  userIds: string().array(),
}).optional();
export type AdminBlockUserInput = infer_<typeof AdminBlockUserSchema>;

export const AdminManageUserSubscriptionSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  toDelete: boolean().optional().default(false),
}).optional();
export type AdminManageUserSubscriptionInput = infer_<
  typeof AdminManageUserSubscriptionSchema
>;

export const AdminManageBusinessSubscriptionSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  tierLevel: number().optional(),
  toDelete: boolean().optional().default(false),
}).optional();
export type AdminManageBusinessSubscriptionInput = infer_<
  typeof AdminManageBusinessSubscriptionSchema
>;

export const AdminManageLanguageSchema = object({
  languages: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageLanguageInput = infer_<typeof AdminManageLanguageSchema>;

export const AdminManageProficiencySchema = object({
  proficiencies: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageProficiencyInput = infer_<
  typeof AdminManageProficiencySchema
>;

export const AdminManageCourtSchema = object({
  courts: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCourtInput = infer_<typeof AdminManageCourtSchema>;

export const AdminManageCategorySchema = object({
  categories: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    categoryImage: any().optional(),
    toDelete: boolean().optional().default(false),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCategoryInput = infer_<typeof AdminManageCategorySchema>;

export const AdminManageTagSchema = object({
  tags: object({
    id: string().optional(),
    name: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageTagInput = infer_<typeof AdminManageTagSchema>;

export const AdminManageCountrySchema = object({
  countries: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCountryInput = infer_<typeof AdminManageCountrySchema>;

export const AdminManageStateSchema = object({
  states: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    countryId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageStateInput = infer_<typeof AdminManageStateSchema>;

export const AdminManageCitySchema = object({
  cities: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    stateId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManageCityInput = infer_<typeof AdminManageCitySchema>;

export const AdminManagePincodeSchema = object({
  pincodes: object({
    id: string().optional(),
    code: string(),
    slug: string().optional(),
    cityId: string(),
  })
    .array()
    .optional(),
}).optional();
export type AdminManagePincodeInput = infer_<typeof AdminManagePincodeSchema>;

export const AdminManageTestimonialSchema = object({
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
export type AdminManageTestimonialInput = infer_<
  typeof AdminManageTestimonialSchema
>;
