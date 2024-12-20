import {
  addBusinessPrimaryContact,
  businessSignup,
  businessSubscription,
  businessVerifyPayment,
  changeBusinessPassword,
  deleteBusinessAccount,
  forgetBusinessPassword,
  manageBusinessAdBannerImage,
  manageBusinessAddress,
  manageBusinessCoverImage,
  manageBusinessMobileAdBannerImage,
  manageBusinessOperatingHours,
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

  manageBusinessCoverImage,

  manageBusinessAdBannerImage,

  manageBusinessMobileAdBannerImage,

  manageBusinessSupportingDocuments,

  manageBusinessOperatingHours,

  businessSubscription,

  businessVerifyPayment,
};
