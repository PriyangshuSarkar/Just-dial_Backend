import { object, string, infer as infer_ } from "zod";

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
