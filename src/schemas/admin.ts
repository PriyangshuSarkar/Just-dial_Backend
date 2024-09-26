import { object, string } from "zod";

export const AdminSignupSchema = object({
  name: string(),
  email: string().email(),
  password: string(),
});

export const VerifyAdminEmailSchema = object({
  email: string(),
  otp: string(),
});

export const AdminLoginSchema = object({
  email: string(),
  password: string(),
});

export const ForgetAdminPasswordSchema = object({
  email: string(),
});

export const ChangeAdminPasswordSchema = object({
  email: string(),
  password: string(),
  otp: string(),
});
