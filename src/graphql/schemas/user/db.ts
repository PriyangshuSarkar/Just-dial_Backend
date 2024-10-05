import { object, string, infer as infer_, any } from "zod";

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

export const UpdateUserDetailsSchema = object({
  token: string(),
  name: string().optional(),
  phone: string().optional(),
  address: object({
    street: string(),
    city: string(),
    state: string(),
    pincode: string(),
  }).optional(),
  avatar: any().optional(),
});
export type UpdateUserDetailsInput = infer_<typeof UpdateUserDetailsSchema>;

// export const FileUploadSchema = object({
//   filename: string(),
//   mimetype: string(),
//   encoding: string(),
//   createReadStream: function_().returns(instanceof_(Readable)),
// });
// export type FileUploadInput = infer_<typeof FileUploadSchema>;
