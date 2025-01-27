import { object, string, infer as infer_, any, boolean } from "zod";

export const UserGoogleOAuthSchema = object({
  redirectURI: string(),
});
export type UserGoogleOAuthInput = infer_<typeof UserGoogleOAuthSchema>;

export const UserGoogleOAuthVerifySchema = object({
  code: string(),
});
export type UserGoogleOAuthVerifyInput = infer_<
  typeof UserGoogleOAuthVerifySchema
>;

export const UserSignupSchema = object({
  name: string().trim().min(2).max(50),
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
  password: string().min(6).max(100),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type UserSignupInput = infer_<typeof UserSignupSchema>;

export const ResendUserOtpSchema = object({
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ResendUserOtpInput = infer_<typeof ResendUserOtpSchema>;

export const AddUserContactSchema = object({
  email: string().trim().email().optional(),
  phone: string().time().optional(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type AddUserContactInput = infer_<typeof AddUserContactSchema>;

export const VerifyUserContactSchema = object({
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
  requestId: string(),
  otp: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type VerifyUserContactInput = infer_<typeof VerifyUserContactSchema>;

export const UserLoginSchema = object({
  email: string().trim().optional(),
  phone: string().trim().optional(),
  password: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type UserLoginInput = infer_<typeof UserLoginSchema>;

export const ForgetUserPasswordSchema = object({
  email: string().trim().optional(),
  phone: string().trim().optional(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ForgetUserPasswordInput = infer_<typeof ForgetUserPasswordSchema>;

export const ChangeUserPasswordSchema = object({
  email: string().trim().optional(),
  phone: string().trim().optional(),
  password: string(),
  otp: string(),
  requestId: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ChangeUserPasswordInput = infer_<typeof ChangeUserPasswordSchema>;

export const UpdateUserDetailsSchema = object({
  name: string().trim().optional(),
  slug: string().trim().optional(),
  hideDetails: boolean().optional(),
  avatar: any().optional(),
}).optional();
export type UpdateUserDetailsInput = infer_<typeof UpdateUserDetailsSchema>;

export const ManageUserAddressSchema = object({
  addresses: object({
    addressId: string().optional(),
    street: string().trim().optional(),
    city: string().trim().optional(),
    state: string().trim().optional(),
    country: string().trim().optional(),
    pincode: string().trim().regex(/^\d*$/).optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageUserAddressInput = infer_<typeof ManageUserAddressSchema>;

export const UserSubscriptionSchema = object({
  subscriptionId: string(),
}).optional();
export type UserSubscriptionInput = infer_<typeof UserSubscriptionSchema>;

export const UserVerifyPaymentSchema = object({
  razorpay_order_id: string(),
  razorpay_payment_id: string(),
  razorpay_signature: string(),
}).optional();
export type UserVerifyPaymentInput = infer_<typeof UserVerifyPaymentSchema>;
