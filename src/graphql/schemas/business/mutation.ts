import {
  addBusinessPrimaryContact,
  businessSignup,
  businessSubscription,
  businessVerifyPayment,
  changeBusinessPassword,
  deleteBusinessAccount,
  forgetBusinessPassword,
  manageBusinessAddress,
  manageBusinessImage,
  manageBusinessSupportingDocuments,
  manageBusinessWebsite,
  updateBusinessDetails,
  verifyBusinessPrimaryContact,
} from "./controller";

export const Mutation = {
  businessSignup,

  verifyBusinessPrimaryContact,

  addBusinessPrimaryContact,

  forgetBusinessPassword,

  changeBusinessPassword,

  updateBusinessDetails,

  deleteBusinessAccount,

  manageBusinessAddress,

  manageBusinessWebsite,

  manageBusinessImage,

  manageBusinessSupportingDocuments,

  businessSubscription,

  businessVerifyPayment,
};
