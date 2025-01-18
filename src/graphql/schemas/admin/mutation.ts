import {
  adminBlockBusinesses,
  adminBlockUsers,
  adminDeleteReviews,
  adminManageAdminNotices,
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
};
