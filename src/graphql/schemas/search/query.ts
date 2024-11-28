import {
  allCategories,
  allCourts,
  allLanguages,
  allProficiencies,
  allTags,
  areas,
  getBusinessById,
  search,
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

  areas,
};
