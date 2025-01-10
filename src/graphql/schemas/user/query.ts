import { getUserAdminNotices, userLogin, userMe } from "./controller";

export const Query = {
  status: () => "Server is running",

  userMe,

  userLogin,

  getUserAdminNotices,
};
