import exp from "constants";
import {
  object,
  string,
  infer as infer_,
  any,
  boolean,
  enum as enum_,
} from "zod";

export const UserMeSchema = object({});
export type UserMeInput = infer_<typeof UserMeSchema>;

export const UserSignupSchema = object({
  name: string().min(2).max(50),
  email: string().email().optional(),
  phone: string().optional(),
  password: string().min(6).max(100),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone must be provided.",
  path: ["email", "phone"],
});
export type UserSignupInput = infer_<typeof UserSignupSchema>;

export const AddUserContactSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type AddUserContactInput = infer_<typeof AddUserContactSchema>;

export const VerifyUserContactSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
  otp: string(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type VerifyUserContactInput = infer_<typeof VerifyUserContactSchema>;

export const UserLoginSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type UserLoginInput = infer_<typeof UserLoginSchema>;

export const ForgetUserPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type ForgetUserPasswordInput = infer_<typeof ForgetUserPasswordSchema>;

export const ChangeUserPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
  otp: string(),
}).refine((data) => (data.email ? !data.phone : !!data.phone), {
  message: "Only one of email or phone should be provided.",
  path: ["email", "phone"],
});
export type ChangeUserPasswordInput = infer_<typeof ChangeUserPasswordSchema>;

export const UpdateUserDetailsSchema = object({
  name: string().optional(),
  slug: string().optional(),
  hideDetails: boolean().optional(),
  avatar: any().optional(),
});
export type UpdateUserDetailsInput = infer_<typeof UpdateUserDetailsSchema>;

export const DeleteUserAccountSchema = object({});
export type DeleteUserAccountInput = infer_<typeof DeleteUserAccountSchema>;

export const ManageUserAddressSchema = object({
  addresses: object({
    addressId: string().optional(),
    street: string().optional(),
    city: string().optional(),
    state: string().optional(),
    country: string().optional(),
    pincode: string().optional(),
    toDelete: boolean().optional(),
  }).array(),
});
export type ManageUserAddressInput = infer_<typeof ManageUserAddressSchema>;

export const UserGoogleOAuthSchema = object({
  googleOAuthToke: string(),
});
export type UserGoogleOAuthInput = infer_<typeof UserGoogleOAuthSchema>;
