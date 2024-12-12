import {
  infer as infer_,
  object,
  enum as enum_,
  boolean,
  number,
  string,
  union,
  null as null_,
} from "zod";

export const FilterSchema = object({
  search: string().optional(),
  verified: boolean().optional(),
  minPrice: number().optional(),
  maxPrice: number().optional(),
  minRating: number().optional(),
  sortBy: enum_(["alphabetical", "rating", "price", "popularity"]).optional(),
  order: enum_(["asc", "desc"]).optional(),
  categoryId: string().optional(),
  categorySlug: string().optional(),
  languages: string().array().optional(),
  courts: string().array().optional(),
  proficiencies: string().array().optional(),
  cityName: string().optional(),
});
export type FilterInput = infer_<typeof FilterSchema>;

export const SearchSchema = FilterSchema.extend({
  page: number().optional().default(1),
  limit: number().optional().default(10),
});
export type SearchInput = infer_<typeof FilterSchema>;

export const LocationPrioritySchema = union([
  object({
    city: string().optional(),
    state: string().optional(),
    country: string().optional(),
  }),
  object({
    city: null_(),
    state: null_(),
    country: null_(),
  }),
]);
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
  search: string().optional(),
});
export type LocationInput = infer_<typeof LocationSchema>;
