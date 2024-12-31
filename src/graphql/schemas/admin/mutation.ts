import {
  blockBusinesses,
  blockUsers,
  manageBusinessSubscription,
  manageCategory,
  manageCity,
  manageCountry,
  manageCourt,
  manageLanguage,
  managePincode,
  manageProficiency,
  manageState,
  manageTag,
  manageTestimonial,
  manageUserSubscription,
  verifyBusinesses,
} from "./controller";

export const Mutation = {
  blockUsers,

  blockBusinesses,

  verifyBusinesses,

  manageUserSubscription,

  manageBusinessSubscription,

  manageLanguage,

  manageProficiency,

  manageCourt,

  manageCategory,

  manageTag,

  manageCountry,

  manageState,

  manageCity,

  managePincode,

  manageTestimonial,
};
