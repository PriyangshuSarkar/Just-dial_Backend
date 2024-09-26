import { infer as infer_ } from "zod";
import {
  ChangeBusinessPasswordSchema,
  ForgetBusinessPasswordSchema,
  BusinessLoginSchema,
  BusinessSignupSchema,
  VerifyBusinessEmailSchema,
} from "../schemas/business";

export type BusinessSignupRequest = infer_<typeof BusinessSignupSchema>;

export type VerifyBusinessEmailRequest = infer_<
  typeof VerifyBusinessEmailSchema
>;

export type BusinessLoginRequest = infer_<typeof BusinessLoginSchema>;

export type ForgetBusinessPasswordRequest = infer_<
  typeof ForgetBusinessPasswordSchema
>;

export type ChangeBusinessPasswordRequest = infer_<
  typeof ChangeBusinessPasswordSchema
>;
