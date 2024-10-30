import { allBusinesses, search } from "./controller";

export const Query = {
  status: () => "Server is running",

  allBusinesses,

  search,
};
