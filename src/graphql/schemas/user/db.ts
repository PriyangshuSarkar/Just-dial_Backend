import { object, string, infer as infer_ } from "zod";

export const UserSignupSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  password: string().min(6).max(100),
});
export type UserSignupInput = infer_<typeof UserSignupSchema>;

export const VerifyUserEmailSchema = object({
  email: string(),
  otp: string(),
});
export type VerifyUserEmailInput = infer_<typeof VerifyUserEmailSchema>;

export const UserLoginSchema = object({
  email: string(),
  password: string(),
});
export type UserLoginInput = infer_<typeof UserLoginSchema>;

export const ForgetUserPasswordSchema = object({
  email: string(),
});
export type ForgetUserPasswordInput = infer_<typeof ForgetUserPasswordSchema>;

export const ChangeUserPasswordSchema = object({
  email: string(),
  password: string(),
  otp: string(),
});
export type ChangeUserPasswordInput = infer_<typeof ChangeUserPasswordSchema>;
