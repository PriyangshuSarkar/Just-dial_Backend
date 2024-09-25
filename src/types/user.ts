import { infer as infer_ } from "zod";
import {
  ChangeUserPasswordSchema,
  ForgetUserPasswordSchema,
  UserLoginSchema,
  UserSignupSchema,
  VerifyUserEmailSchema,
} from "../schemas/user";

export type UserSignupRequest = infer_<typeof UserSignupSchema>;

export type VerifyUserEmailRequest = infer_<typeof VerifyUserEmailSchema>;

export type UserLoginRequest = infer_<typeof UserLoginSchema>;

export type ForgetUserPasswordRequest = infer_<typeof ForgetUserPasswordSchema>;

export type ChangeUserPasswordRequest = infer_<typeof ChangeUserPasswordSchema>;
