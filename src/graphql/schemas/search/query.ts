import {
  allCategories,
  allCourts,
  allLanguages,
  allProficiencies,
  allTags,
  areas,
  search,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  search,

  allLanguages,

  allProficiencies,

  allCourts,

  allCategories,

  allTags,

  areas,
};
