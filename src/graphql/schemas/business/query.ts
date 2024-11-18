import { businessLogin, businessMe } from "./controller";

export const Query = {
  status: () => "Server is running",

  businessMe,

  businessLogin,
};
