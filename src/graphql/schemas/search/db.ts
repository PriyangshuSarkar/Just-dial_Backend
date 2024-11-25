import {
  infer as infer_,
  object,
  enum as enum_,
  boolean,
  number,
  string,
  any,
  union,
  undefined,
  null as null_,
} from "zod";

export const FilterSchema = object({
  verified: boolean().optional(),
  minPrice: number().optional(),
  maxPrice: number().optional(),
  minRating: number().optional(),
  sortBy: enum_(["alphabetical", "rating", "price", "popularity"]).optional(),
  order: enum_(["asc", "desc"]).optional(),
  categoryId: string().optional(),
  languages: string().array().optional(),
  courts: string().array().optional(),
  proficiencies: string().array().optional(),
});
export type FilterInput = infer_<typeof FilterSchema>;

export const SearchSchema = FilterSchema.extend({
  cityName: string().optional(),
  businessName: string().optional(),
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

export const AreaSchema = object({
  search: string(),
});
export type AreaInput = infer_<typeof AreaSchema>;
