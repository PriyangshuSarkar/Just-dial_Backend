import { object, string, infer as infer_ } from "zod";

export const UserSignupSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  password: string().min(8).max(100),
});

export type UserSignupInput = infer_<typeof UserSignupSchema>;
