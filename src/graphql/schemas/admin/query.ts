import { adminLogin } from "./controller";

export const Query = {
  status: () => "Server is running",

  adminLogin,
};
