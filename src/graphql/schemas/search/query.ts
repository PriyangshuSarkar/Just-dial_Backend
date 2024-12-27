import {
  allCategories,
  allCourts,
  allLanguages,
  allProficiencies,
  allTags,
  getBusinessById,
  search,
  location,
  allTestimonials,
  getAllAddBanners,
  getAllMobileAddBanners,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  search,

  getBusinessById,

  allLanguages,

  allProficiencies,

  allCourts,

  allCategories,

  allTags,

  allTestimonials,

  location,

  getAllAddBanners,

  getAllMobileAddBanners,
};
