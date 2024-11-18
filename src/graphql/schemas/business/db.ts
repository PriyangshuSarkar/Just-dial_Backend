import { password } from "bun";
import { url } from "inspector";
import {
  object,
  string,
  infer as infer_,
  any,
  number,
  enum as enum_,
  boolean,
} from "zod";

export const BusinessMeSchema = object({});
export type BusinessMeInput = infer_<typeof BusinessMeSchema>;

export const BusinessSignupSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
  type: enum_(["INDIVIDUAL", "FIRM"]),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone must be provided.",
  path: ["email", "phone"],
});
export type BusinessSignupInput = infer_<typeof BusinessSignupSchema>;

export const VerifyBusinessPrimaryContactSchema = object({
  email: string().optional(),
  phone: string().optional(),
  otp: string(),
  password: string().optional(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type VerifyBusinessPrimaryContactInput = infer_<
  typeof VerifyBusinessPrimaryContactSchema
>;

export const AddBusinessPrimaryContactSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type AddBusinessPrimaryContactInput = infer_<
  typeof AddBusinessPrimaryContactSchema
>;

export const BusinessLoginSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type BusinessLoginInput = infer_<typeof BusinessLoginSchema>;

export const ForgetBusinessPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type ForgetBusinessPasswordInput = infer_<
  typeof ForgetBusinessPasswordSchema
>;

export const ChangeBusinessPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
  otp: string(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type ChangeBusinessPasswordInput = infer_<
  typeof ChangeBusinessPasswordSchema
>;

export const UpdateBusinessDetailsSchema = object({
  name: string().optional(),
  slug: string().optional(),
  type: enum_(["INDIVIDUAL", "FIRM"]).optional(),
  isListed: boolean().optional(),
  registrationNumber: string().optional(),
  license: string().optional(),
  experience: number().optional(),
  teamSize: number().optional(),
  description: string().optional(),
  degrees: string().toLowerCase().array().optional(),
  gstNumber: string().optional(),
  categoryId: string().optional(),
  languages: string().toLowerCase().array().optional(),
  proficiencies: string().toLowerCase().array().optional(),
  courts: string().toLowerCase().array().optional(),
  tags: string().toLowerCase().array().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
  additionalContacts: string().array().optional(),
  logo: any().optional(),
});
export type UpdateBusinessDetailsInput = infer_<
  typeof UpdateBusinessDetailsSchema
>;

export const DeleteBusinessAccountSchema = object({});
export type DeleteBusinessAccountInput = infer_<
  typeof DeleteBusinessAccountSchema
>;

export const ManageBusinessAddressSchema = object({
  addresses: object({
    order: number().optional(),
    addressId: string().optional(),
    street: string().optional(),
    city: string().optional(),
    state: string().optional(),
    country: string().optional(),
    pincode: string().optional(),
    toDelete: boolean().optional(),
  }).array(),
});
export type ManageBusinessAddressInput = infer_<
  typeof ManageBusinessAddressSchema
>;

export const ManageBusinessWebsiteSchema = object({
  websites: object({
    websiteId: string().optional(),
    type: string().optional(),
    url: string().url().optional(),
    toDelete: boolean().optional(),
  }).array(),
});
export type ManageBusinessWebsiteInput = infer_<
  typeof ManageBusinessWebsiteSchema
>;

export const ManageBusinessImageSchema = object({
  images: object({
    imageId: string().optional(),
    image: any().optional(),
    order: number().optional(),
    toDelete: boolean().optional(),
  }).array(),
});
export type ManageBusinessImageInput = infer_<typeof ManageBusinessImageSchema>;

export const ManageBusinessSupportingDocumentsSchema = object({
  documents: object({
    documentId: string().optional(),
    type: string().optional(),
    document: any().optional(),
    toDelete: boolean().optional(),
  }).array(),
});
export type ManageBusinessSupportingDocumentsInput = infer_<
  typeof ManageBusinessSupportingDocumentsSchema
>;
