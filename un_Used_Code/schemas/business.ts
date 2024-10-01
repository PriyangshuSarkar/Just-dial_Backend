import { object, string } from "zod";

export const BusinessSignupSchema = object({
  name: string(),
  email: string().email(),
  password: string(),
});

export const VerifyBusinessEmailSchema = object({
  email: string(),
  otp: string(),
});

export const BusinessLoginSchema = object({
  email: string(),
  password: string(),
});

export const ForgetBusinessPasswordSchema = object({
  email: string(),
});

export const ChangeBusinessPasswordSchema = object({
  email: string(),
  password: string(),
  otp: string(),
});
