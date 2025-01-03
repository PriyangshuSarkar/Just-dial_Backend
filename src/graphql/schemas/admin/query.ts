import {
  adminAllBusinesses,
  adminAllUsers,
  adminLogin,
  adminSearchAllReviews,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  adminLogin,

  adminAllUsers,

  adminAllBusinesses,

  adminSearchAllReviews,
};
