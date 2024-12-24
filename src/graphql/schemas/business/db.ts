import {
  object,
  string,
  infer as infer_,
  any,
  number,
  enum as enum_,
  boolean,
} from "zod";

export const BusinessSignupSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type BusinessSignupInput = infer_<typeof BusinessSignupSchema>;

export const ResendBusinessOtpSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ResendBusinessOtpInput = infer_<typeof ResendBusinessOtpSchema>;

export const VerifyBusinessPrimaryContactSchema = object({
  email: string().optional(),
  phone: string().optional(),
  otp: string(),
  password: string().optional(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type VerifyBusinessPrimaryContactInput = infer_<
  typeof VerifyBusinessPrimaryContactSchema
>;

export const AddBusinessPrimaryContactSchema = object({
  email: string().email().optional(),
  phone: string().optional(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type AddBusinessPrimaryContactInput = infer_<
  typeof AddBusinessPrimaryContactSchema
>;

export const BusinessLoginSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type BusinessLoginInput = infer_<typeof BusinessLoginSchema>;

export const ForgetBusinessPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ForgetBusinessPasswordInput = infer_<
  typeof ForgetBusinessPasswordSchema
>;

export const ChangeBusinessPasswordSchema = object({
  email: string().optional(),
  phone: string().optional(),
  password: string(),
  otp: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ChangeBusinessPasswordInput = infer_<
  typeof ChangeBusinessPasswordSchema
>;

export const UpdateBusinessDetailsSchema = object({
  name: string().optional(),
  slug: string().optional(),
  isListed: boolean().optional(),
  registrationNumber: string().optional(),
  license: string().optional(),
  experience: number().optional(),
  teamSize: number().optional(),
  description: string().optional(),
  degrees: string().toLowerCase().array().optional(),
  gstNumber: string().optional(),
  categoryIds: string().optional().array().optional(),
  languages: string().toLowerCase().array().optional(),
  proficiencies: string().toLowerCase().array().optional(),
  courts: string().toLowerCase().array().optional(),
  tags: string().toLowerCase().array().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
  additionalContacts: string().array().optional(),
  logo: any().optional(),
  primaryWebsite: string().url().optional(),
}).optional();
export type UpdateBusinessDetailsInput = infer_<
  typeof UpdateBusinessDetailsSchema
>;

export const ManageBusinessAddressSchema = object({
  addresses: object({
    order: number().optional(),
    addressId: string().optional(),
    street: string().optional(),
    city: string().optional(),
    state: string().optional(),
    country: string().optional(),
    pincode: string().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessAddressInput = infer_<
  typeof ManageBusinessAddressSchema
>;

export const ManageBusinessWebsiteSchema = object({
  websites: object({
    websiteId: string().optional(),
    type: string().optional(),
    url: string().url().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessWebsiteInput = infer_<
  typeof ManageBusinessWebsiteSchema
>;

export const ManageBusinessCoverImageSchema = object({
  coverImages: object({
    imageId: string().optional(),
    image: any().optional(),
    order: number().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessCoverImageInput = infer_<
  typeof ManageBusinessCoverImageSchema
>;
export const ManageBusinessAdBannerImageSchema = object({
  adBannerImages: object({
    imageId: string().optional(),
    image: any().optional(),
    order: number().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessAdBannerImageInput = infer_<
  typeof ManageBusinessAdBannerImageSchema
>;
export const ManageBusinessMobileAdBannerImageSchema = object({
  mobileAdBannerImages: object({
    imageId: string().optional(),
    image: any().optional(),
    order: number().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessMobileAdBannerImageInput = infer_<
  typeof ManageBusinessMobileAdBannerImageSchema
>;

export const ManageBusinessSupportingDocumentsSchema = object({
  documents: object({
    documentId: string().optional(),
    type: string().optional(),
    document: any().optional(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessSupportingDocumentsInput = infer_<
  typeof ManageBusinessSupportingDocumentsSchema
>;

// const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/; // Matches "HH:mm" format

export const ManageBusinessOperatingHoursSchema = object({
  operatingHours: object({
    dayOfWeek: enum_([
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ]),
    openingTime: string(),
    closingTime: string(),
    toDelete: boolean().optional(),
  })
    .array()
    .optional(),
}).optional();
export type ManageBusinessOperatingHoursInput = infer_<
  typeof ManageBusinessOperatingHoursSchema
>;

export const BusinessSubscriptionSchema = object({
  subscriptionId: string(),
}).optional();
export type BusinessSubscriptionInput = infer_<
  typeof BusinessSubscriptionSchema
>;

export const BusinessVerifyPaymentSchema = object({
  razorpay_order_id: string(),
  razorpay_payment_id: string(),
  razorpay_signature: string(),
}).optional();
export type BusinessVerifyPaymentInput = infer_<
  typeof BusinessVerifyPaymentSchema
>;
