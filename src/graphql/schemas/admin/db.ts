import { object, string, infer as infer_ } from "zod";

export const AdminSignupSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  password: string().min(6).max(100),
});
export type AdminSignupInput = infer_<typeof AdminSignupSchema>;

export const VerifyAdminEmailSchema = object({
  email: string(),
  otp: string(),
});
export type VerifyAdminEmailInput = infer_<typeof VerifyAdminEmailSchema>;

export const AdminLoginSchema = object({
  email: string(),
  password: string(),
});
export type AdminLoginInput = infer_<typeof AdminLoginSchema>;

export const ForgetAdminPasswordSchema = object({
  email: string(),
});
export type ForgetAdminPasswordInput = infer_<typeof ForgetAdminPasswordSchema>;

export const ChangeAdminPasswordSchema = object({
  email: string(),
  password: string(),
  otp: string(),
});
export type ChangeAdminPasswordInput = infer_<typeof ChangeAdminPasswordSchema>;
