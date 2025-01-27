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
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type BusinessSignupInput = infer_<typeof BusinessSignupSchema>;

export const ResendBusinessOtpSchema = object({
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
})
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type ResendBusinessOtpInput = infer_<typeof ResendBusinessOtpSchema>;

export const VerifyBusinessPrimaryContactSchema = object({
  email: string().trim().optional(),
  phone: string().trim().optional(),
  otp: string(),
  requestId: string(),
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
  email: string().trim().email().optional(),
  phone: string().trim().optional(),
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
  email: string().trim().optional(),
  phone: string().trim().optional(),
  password: string(),
})
  .refine((data) => (data.email ? !data.phone : !!data.phone), {
    message: "Only one of email or phone should be provided.",
    path: ["email", "phone"],
  })
  .optional();
export type BusinessLoginInput = infer_<typeof BusinessLoginSchema>;

export const ForgetBusinessPasswordSchema = object({
  email: string().trim().optional(),
  phone: string().trim().optional(),
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
export type ChangeBusinessPasswordInput = infer_<
  typeof ChangeBusinessPasswordSchema
>;

export const UpdateBusinessDetailsSchema = object({
  name: string().trim().optional(),
  slug: string().trim().optional(),
  isListed: boolean().optional(),
  registrationNumber: string().trim().optional(),
  license: string().trim().optional(),
  experience: number().optional(),
  teamSize: number().optional(),
  description: string().optional(),
  degrees: string().trim().array().optional(),
  gstNumber: string().trim().optional(),
  categoryIds: string().optional().array().optional(),
  languages: string().trim().toLowerCase().array().optional(),
  proficiencies: string().trim().toLowerCase().array().optional(),
  courts: string().trim().toLowerCase().array().optional(),
  tags: string().trim().toUpperCase().array().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
  additionalContacts: string().trim().array().optional(),
  logo: any().optional(),
  primaryWebsite: string().trim().optional(),
}).optional();
export type UpdateBusinessDetailsInput = infer_<
  typeof UpdateBusinessDetailsSchema
>;

export const ManageBusinessAddressSchema = object({
  addresses: object({
    order: number().optional(),
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
export type ManageBusinessAddressInput = infer_<
  typeof ManageBusinessAddressSchema
>;

export const ManageBusinessWebsiteSchema = object({
  websites: object({
    websiteId: string().optional(),
    type: string().trim().optional(),
    url: string().trim().optional(),
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
    type: string().trim().optional(),
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
    openingTime: string().optional(),
    closingTime: string().optional(),
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
