import { adminLogin, allBusinesses, allUsers } from "./controller";

export const Query = {
  status: () => "Server is running",

  adminLogin,

  allUsers,

  allBusinesses,
};
