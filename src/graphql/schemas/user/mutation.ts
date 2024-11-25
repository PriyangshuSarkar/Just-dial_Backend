import {
  addUserContact,
  changeUserPassword,
  deleteUserAccount,
  forgetUserPassword,
  manageUserAddress,
  updateUserDetails,
  userGoogleOAuth,
  userSignup,
  userSubscription,
  userVerifyPayment,
  verifyUserContact,
} from "./controller";

export const Mutation = {
  userGoogleOAuth,

  userSignup,

  addUserContact,

  verifyUserContact,

  forgetUserPassword,

  changeUserPassword,

  updateUserDetails,

  deleteUserAccount,

  manageUserAddress,

  userSubscription,

  userVerifyPayment,
};
