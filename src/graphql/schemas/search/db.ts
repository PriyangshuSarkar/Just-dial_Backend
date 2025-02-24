import {
  infer as infer_,
  object,
  enum as enum_,
  boolean,
  number,
  string,
} from "zod";

export const FilterSchema = object({
  search: string().trim().toLowerCase().optional(),
  verified: boolean()
    .transform((value) => (value === true ? true : undefined))
    .optional(),
  minPrice: number().optional(),
  maxPrice: number().optional(),
  minRating: number().optional(),
  sortBy: enum_([
    "alphabetical",
    "rating",
    "price",
    "popularity",
    "experience",
  ]).optional(),
  order: enum_(["asc", "desc"]).optional(),
  categoryId: string().optional(),
  categorySlug: string().optional(),
  languages: string().trim().toLowerCase().array().optional(),
  courts: string().trim().toLowerCase().array().optional(),
  proficiencies: string().trim().toLowerCase().array().optional(),
  pincode: string().trim().toLowerCase().regex(/^\d*$/).optional(),
  city: string().trim().toLowerCase().optional(),
  state: string().trim().toLowerCase().optional(),
  country: string().trim().toLowerCase().optional(),
});
export type FilterInput = infer_<typeof FilterSchema>;

export const SearchSchema = FilterSchema.extend({
  page: number().optional().default(1),
  limit: number().optional().default(10),
});
export type SearchInput = infer_<typeof FilterSchema>;

export const LocationPrioritySchema = object({
  pincode: string().optional(),
  city: string().optional(),
  state: string().optional(),
  country: string().optional(),
});
export type LocationPriorityInput = infer_<typeof LocationPrioritySchema>;

export const GetBusinessByIdSchema = object({
  businessId: string().optional(),
  businessSlug: string().optional(),
}).refine((data) => data.businessId || data.businessSlug, {
  message: "Either businessId or businessSlug must be provided",
  path: ["businessId", "businessSlug"],
});
export type GetBusinessByIdInput = infer_<typeof GetBusinessByIdSchema>;

export const LocationSchema = object({
  search: string().toLowerCase().optional(),
});
export type LocationInput = infer_<typeof LocationSchema>;

export const AllTestimonialsInput = object({
  type: enum_(["REVIEW", "FEEDBACK"]).optional().default("FEEDBACK"),
  filter: enum_(["USER", "BUSINESS"]).optional(),
  page: number().optional().default(1),
  limit: number().optional().default(10),
});

export type AllTestimonialsInput = infer_<typeof AllTestimonialsInput>;

export const GetAllAdminNoticesSchema = object({
  types: enum_(["GLOBAL", "ALL_USER", "ALL_BUSINESS"])
    .array()
    .optional()
    .default(["GLOBAL"]),
}).optional();
export type GetAllAdminNoticesInput = infer_<typeof GetAllAdminNoticesSchema>;

export const RaiseQuerySchema = object({
  name: string().trim().optional(),
  phone: string().trim().optional(),
  email: string().trim().email(),
  subject: string().trim().optional(),
  message: string().trim().optional(),
}).optional();
export type RaiseQueryInput = infer_<typeof RaiseQuerySchema>;
