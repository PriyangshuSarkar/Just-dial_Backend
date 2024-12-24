import {
  addUserContact,
  changeUserPassword,
  deleteUserAccount,
  forgetUserPassword,
  manageUserAddress,
  resendUserOtp,
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

  resendUserOtp,

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
