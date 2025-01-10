import {
  businessLogin,
  businessMe,
  getBusinessAdminNotices,
} from "./controller";

export const Query = {
  status: () => "Server is running",

  businessMe,

  businessLogin,

  getBusinessAdminNotices,
};
