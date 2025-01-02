import {
  allCategories,
  allCourts,
  allLanguages,
  allProficiencies,
  allTags,
  getBusinessById,
  location,
  allTestimonials,
  getAllAddBanners,
  getAllMobileAddBanners,
  getAllBusinesses,
} from "./controller";
import { search } from "./searchController";

export const Query = {
  status: () => "Server is running",

  search,

  getAllBusinesses,

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
