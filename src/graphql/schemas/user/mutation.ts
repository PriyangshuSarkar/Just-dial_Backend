import {
  changeUserPassword,
  forgetUserPassword,
  updateUserDetails,
  userLogin,
  userSignup,
  verifyUserEmail,
} from "./controller";

export const Mutation = {
  userSignup,

  verifyUserEmail,

  userLogin,

  forgetUserPassword,

  changeUserPassword,

  updateUserDetails,
};
