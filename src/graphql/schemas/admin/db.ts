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
});
export type AdminLoginInput = infer_<typeof AdminLoginSchema>;

export const AllUsersSchema = object({
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
});
export type AllUserInput = infer_<typeof AllUsersSchema>;

export const AllBusinessesSchema = object({
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
});
export type AllBusinessesInput = infer_<typeof AllBusinessesSchema>;

export const VerifyBusinessesSchema = object({
  businessIds: string().array(),
});
export type VerifyBusinessesInput = infer_<typeof VerifyBusinessesSchema>;

export const BlockBusinessesSchema = object({
  businessIds: string().array(),
});
export type BlockBusinessesInput = infer_<typeof BlockBusinessesSchema>;

export const BlockUserSchema = object({
  userIds: string().array(),
});
export type BlockUserInput = infer_<typeof BlockUserSchema>;

export const ManageUserSubscriptionSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  toDelete: boolean().optional().default(false),
});
export type ManageUserSubscriptionInput = infer_<
  typeof ManageUserSubscriptionSchema
>;

export const ManageBusinessSubscriptionSchema = object({
  id: string().optional(),
  name: string().optional(),
  description: string().optional(),
  price: number().optional(),
  duration: number().optional(),
  features: string().array().optional(),
  tierLevel: number().optional(),
  toDelete: boolean().optional().default(false),
});
export type ManageBusinessSubscriptionInput = infer_<
  typeof ManageBusinessSubscriptionSchema
>;

export const ManageLanguageSchema = object({
  languages: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  }).array(),
});
export type ManageLanguageInput = infer_<typeof ManageLanguageSchema>;

export const ManageProficiencySchema = object({
  proficiencies: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  }).array(),
});
export type ManageProficiencyInput = infer_<typeof ManageProficiencySchema>;

export const ManageCourtSchema = object({
  courts: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    toDelete: boolean().optional().default(false),
  }).array(),
});
export type ManageCourtInput = infer_<typeof ManageCourtSchema>;

export const ManageCategorySchema = object({
  categories: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    categoryImage: any().optional(),
    toDelete: boolean().optional().default(false),
  }).array(),
});
export type ManageCategoryInput = infer_<typeof ManageCategorySchema>;

export const ManageTagSchema = object({
  tags: object({
    id: string().optional(),
    name: string(),
  }).array(),
});
export type ManageTagInput = infer_<typeof ManageTagSchema>;

export const ManageCountrySchema = object({
  countries: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
  }).array(),
});
export type ManageCountryInput = infer_<typeof ManageCountrySchema>;

export const ManageStateSchema = object({
  states: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    countryId: string(),
  }).array(),
});
export type ManageStateInput = infer_<typeof ManageStateSchema>;

export const ManageCitySchema = object({
  cities: object({
    id: string().optional(),
    name: string(),
    slug: string().optional(),
    stateId: string(),
  }).array(),
});
export type ManageCityInput = infer_<typeof ManageCitySchema>;

export const ManagePincodeSchema = object({
  pincodes: object({
    id: string().optional(),
    code: string(),
    slug: string().optional(),
    cityId: string(),
  }).array(),
});
export type ManagePincodeInput = infer_<typeof ManagePincodeSchema>;

export const ManageTestimonialSchema = object({
  testimonials: object({
    id: string().optional(),
    reviewId: string().optional(),
    feedbackId: string().optional(),
    order: number().optional(),
    toDelete: boolean().optional().default(false),
  }).array(),
});
export type ManageTestimonialInput = infer_<typeof ManageTestimonialSchema>;
