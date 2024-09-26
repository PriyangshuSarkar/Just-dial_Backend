import { infer as infer_ } from "zod";
import {
  ChangeAdminPasswordSchema,
  ForgetAdminPasswordSchema,
  AdminLoginSchema,
  AdminSignupSchema,
  VerifyAdminEmailSchema,
} from "../schemas/admin";

export type AdminSignupRequest = infer_<typeof AdminSignupSchema>;

export type VerifyAdminEmailRequest = infer_<typeof VerifyAdminEmailSchema>;

export type AdminLoginRequest = infer_<typeof AdminLoginSchema>;

export type ForgetAdminPasswordRequest = infer_<
  typeof ForgetAdminPasswordSchema
>;

export type ChangeAdminPasswordRequest = infer_<
  typeof ChangeAdminPasswordSchema
>;
