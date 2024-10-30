import {
  infer as infer_,
  object,
  enum as enum_,
  boolean,
  number,
  string,
} from "zod";

export const AllBusinessesSchema = object({
  page: number().optional().default(1),
  limit: number().optional().default(10),
});
export type AllBusinessesInput = infer_<typeof AllBusinessesSchema>;

export const SearchSchema = object({
  sortBy: enum_(["alphabetical", "rating", "popularity", "price"]).optional(),
  order: enum_(["asc", "desc"]).optional(),
  verified: boolean().optional(),
  minPrice: number().optional(),
  maxPrice: number().optional(),
  minRating: number().optional(),
  cityName: string(),
  serviceName: string(),
  page: number().optional().default(1),
  limit: number().optional().default(10),
});
export type SearchInput = infer_<typeof FilterSchema>;

export const FilterSchema = object({
  sortBy: enum_(["alphabetical", "rating", "popularity", "price"]).optional(),
  order: enum_(["asc", "desc"]).optional(),
  verified: boolean().optional(),
  minPrice: number().optional(),
  maxPrice: number().optional(),
  minRating: number().optional(),
});
export type FilterInput = infer_<typeof FilterSchema>;

export const LocationPrioritySchema = object({
  cityId: string().optional(),
  stateId: string().optional(),
  countryId: string().optional(),
});
export type LocationPriorityInput = infer_<typeof LocationPrioritySchema>;
