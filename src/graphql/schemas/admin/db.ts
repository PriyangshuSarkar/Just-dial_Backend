import exp from "constants";
import slugify from "slugify";
import {
  object,
  string,
  infer as infer_,
  enum as enum_,
  number,
  boolean,
  array,
  date,
  any,
  isValid,
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
  type: enum_(["INDIVIDUAL", "FIRM"]).optional(),
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
