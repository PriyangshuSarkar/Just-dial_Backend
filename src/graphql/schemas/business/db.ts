import { object, string, infer as infer_, any, number } from "zod";

export const BusinessMeSchema = object({
  token: string(),
});
export type BusinessMeInput = infer_<typeof BusinessMeSchema>;

export const BusinessSignupSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  password: string().min(6).max(100),
});
export type BusinessSignupInput = infer_<typeof BusinessSignupSchema>;

export const VerifyBusinessEmailSchema = object({
  email: string(),
  otp: string(),
});
export type VerifyBusinessEmailInput = infer_<typeof VerifyBusinessEmailSchema>;

export const BusinessLoginSchema = object({
  email: string(),
  password: string(),
});
export type BusinessLoginInput = infer_<typeof BusinessLoginSchema>;

export const ForgetBusinessPasswordSchema = object({
  email: string(),
});
export type ForgetBusinessPasswordInput = infer_<
  typeof ForgetBusinessPasswordSchema
>;

export const ChangeBusinessPasswordSchema = object({
  email: string(),
  password: string(),
  otp: string(),
});
export type ChangeBusinessPasswordInput = infer_<
  typeof ChangeBusinessPasswordSchema
>;

export const UpdateBusinessDetailsSchema = object({
  token: string(),
  name: string().optional(),
  website: string().url().optional(),
  phone: string().optional(),
  type: string().optional(),
  companyLogo: any().optional(), // Handle single logo upload
  companyImages: any().array().optional(), // Handle multiple image uploads
  companyImagesToDelete: string().array().optional(), // New field
});
export type UpdateBusinessDetailsInput = infer_<
  typeof UpdateBusinessDetailsSchema
>;

export const AddServiceSchema = object({
  token: string(),
  name: string(),
  overview: string().optional(),
  price: number().nonnegative(),
  discountedPrice: number().optional(),
  serviceImages: any().array().optional(), // URLs of images
  tags: string().toLowerCase().array().optional(),
  facilities: string().toLowerCase().array().optional(),
  subcategoryId: string(), // assuming subcategory is required
});
export type AddServiceInput = infer_<typeof AddServiceSchema>;

export const UpdateServiceSchema = object({
  token: string(),
  serviceId: string(),
  name: string().optional(),
  overview: string().optional(),
  price: number().optional(),
  discountedPrice: number().optional(),
  tags: string().toLowerCase().array().optional(),
  facilities: string().toLowerCase().array().optional(),
  tagsToDelete: string().toLowerCase().array().optional(),
  facilitiesToDelete: string().toLowerCase().array().optional(),
  serviceImages: any().array().optional(), // URLs of new images to add
  serviceImagesToDelete: string().array().optional(), // URLs of images to delete
});
export type UpdateServiceInput = infer_<typeof UpdateServiceSchema>;

export const RemoveServiceSchema = object({
  token: string(),
  serviceId: string(),
});
export type RemoveServiceInput = infer_<typeof RemoveServiceSchema>;
