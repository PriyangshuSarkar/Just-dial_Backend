import {
  adminLogin,
  allBusinesses,
  allUsers,
  searchAllReviews,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  adminLogin,

  allUsers,

  allBusinesses,

  searchAllReviews,
};
