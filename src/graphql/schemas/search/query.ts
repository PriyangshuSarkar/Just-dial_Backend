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
};
