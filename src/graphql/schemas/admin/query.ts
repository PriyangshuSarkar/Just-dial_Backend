import {
  adminAllBusinesses,
  adminAllUsers,
  adminGetAllAdminNotices,
  adminGetAllBusinessSubscriptions,
  adminGetAllCategories,
  adminGetAllCities,
  adminGetAllCountries,
  adminGetAllCourts,
  adminGetAllLanguages,
  adminGetAllPincodes,
  adminGetAllProficiencies,
  adminGetAllStates,
  adminGetAllTags,
  adminGetAllTestimonials,
  adminGetAllUserSubscriptions,
  adminGetBusinessById,
  adminGetUserById,
  adminLogin,
  adminSearchAllFeedbacks,
  adminSearchAllReviews,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  adminLogin,

  adminAllUsers,

  adminGetUserById,

  adminAllBusinesses,

  adminGetBusinessById,

  adminSearchAllReviews,

  adminSearchAllFeedbacks,

  adminGetAllUserSubscriptions,

  adminGetAllBusinessSubscriptions,

  adminGetAllLanguages,

  adminGetAllProficiencies,

  adminGetAllCourts,

  adminGetAllCategories,

  adminGetAllTags,

  adminGetAllCountries,

  adminGetAllStates,

  adminGetAllCities,

  adminGetAllPincodes,

  adminGetAllTestimonials,

  adminGetAllAdminNotices,
};
