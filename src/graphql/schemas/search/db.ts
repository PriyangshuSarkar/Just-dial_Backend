import {
  infer as infer_,
  object,
  enum as enum_,
  boolean,
  number,
  string,
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
  cityName: string(),
  businessName: string().optional(),
  page: number().optional().default(1),
  limit: number().optional().default(10),
});
export type SearchInput = infer_<typeof FilterSchema>;

export const LocationPrioritySchema = object({
  city: string().optional(),
  state: string().optional(),
  country: string().optional(),
});
export type LocationPriorityInput = infer_<typeof LocationPrioritySchema>;
