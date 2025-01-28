import {
  adminBlockBusinesses,
  adminBlockUsers,
  adminChangePassword,
  adminDeleteReviews,
  adminManageAdminNotices,
  adminManageBusinessAdBannerImage,
  adminManageBusinessMobileAdBannerImage,
  adminManageBusinessSubscriptions,
  adminManageCategories,
  adminManageCities,
  adminManageCountries,
  adminManageCourts,
  adminManageLanguages,
  adminManagePincodes,
  adminManageProficiencies,
  adminManageStates,
  adminManageTags,
  adminManageTestimonials,
  adminManageUserSubscriptions,
  adminVerifyBusinesses,
} from "./controller";

export const Mutation = {
  adminChangePassword,

  adminBlockUsers,

  adminBlockBusinesses,

  adminVerifyBusinesses,

  adminDeleteReviews,

  adminManageUserSubscriptions,

  adminManageBusinessSubscriptions,

  adminManageLanguages,

  adminManageProficiencies,

  adminManageCourts,

  adminManageCategories,

  adminManageTags,

  adminManageCountries,

  adminManageStates,

  adminManageCities,

  adminManagePincodes,

  adminManageTestimonials,

  adminManageAdminNotices,

  adminManageBusinessAdBannerImage,

  adminManageBusinessMobileAdBannerImage,
};
