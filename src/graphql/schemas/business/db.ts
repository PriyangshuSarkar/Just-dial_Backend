import { object, string, infer as infer_, any, number } from "zod";

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
  address: object({
    street: string().toLowerCase(),
    city: string().toLowerCase(),
    state: string().toLowerCase(),
    pincode: string().toLowerCase(),
    country: string().toLowerCase(),
  }).optional(),
  addressesToDelete: string().array().optional(),
  companyLogo: any().optional(), // Handle single logo upload
  companyImages: any().array().optional(), // Handle multiple image uploads
  companyImagesToDelete: string().array().optional(), // New field
});
export type UpdateBusinessDetailsInput = infer_<
  typeof UpdateBusinessDetailsSchema
>;

export const AddOrUpdateServiceSchema = object({
  serviceId: string().optional(),
  token: string(),
  name: string(),
  overview: string().optional(),
  price: number(),
  discountedPrice: number().optional(),
  serviceImages: any().optional(),
  businessId: string(),
  subcategoryId: string(),
  tags: string().toLowerCase().array().optional(),
  facilities: string().toLowerCase().array().optional(),
  address: object({
    street: string().toLowerCase(),
    city: string().toLowerCase(),
    state: string().toLowerCase(),
    pincode: string().toLowerCase(),
    country: string().toLowerCase(),
  }).optional(),
  addressesToDelete: string().array().optional(),
  serviceImagesToDelete: string().array().optional(),
  tagsToDelete: string().array().optional(),
  facilitiesToDelete: string().array().optional(),
});
export type AddOrUpdateServiceInput = infer_<typeof AddOrUpdateServiceSchema>;
