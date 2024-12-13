import { boolean, number, object, string, infer as infer_ } from "zod";

export const ReviewBusinessSchema = object({
  id: string().optional(),
  rating: number().min(1).max(5).optional(),
  comment: string().optional(),
  businessId: string().optional(),
  toDelete: boolean().optional(),
});
export type ReviewBusinessInput = infer_<typeof ReviewBusinessSchema>;
