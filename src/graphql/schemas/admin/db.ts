import { object, string, infer as infer_ } from "zod";

export const AdminLoginSchema = object({
  email: string(),
  password: string(),
});
export type AdminLoginInput = infer_<typeof AdminLoginSchema>;
