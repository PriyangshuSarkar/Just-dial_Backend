import { boolean, number, object, string, infer as infer_ } from "zod";

export const ReviewBusinessSchema = object({
  id: string().optional(),
  rating: number().min(1).max(5).optional(),
  comment: string().optional(),
  businessId: string().optional(),
  businessSlug: string().optional(),
  toDelete: boolean().optional(),
}).optional();
export type ReviewBusinessInput = infer_<typeof ReviewBusinessSchema>;

export const FeedbackSchema = object({
  id: string().optional(),
  rating: number().min(1).max(5).optional(),
  comment: string().optional(),
  toDelete: boolean().optional(),
}).optional();
export type FeedbackInput = infer_<typeof FeedbackSchema>;

export const GetReviewWithIdSchema = object({
  id: string().optional(),
  userId: string().optional(),
  userSlug: string().optional(),
  businessId: string().optional(),
  businessSlug: string().optional(),
})
  .refine(
    (data) =>
      data.id ||
      ((data.userSlug || data.userId) &&
        (data.businessId || data.businessSlug)),
    {
      message:
        "Either userSlug or userId must be provided and either businessSlug or businessId must be provided OR ID",
      path: ["id", "userSlug", "userId", "businessSlug", "businessId"], // Pointing to both fields for clarity
    }
  )
  .optional();
export type GetReviewWithIdInput = infer_<typeof GetReviewWithIdSchema>;
