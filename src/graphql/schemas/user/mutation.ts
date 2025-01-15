import {
  addUserContact,
  changeUserPassword,
  deleteUserAccount,
  forgetUserPassword,
  manageUserAddress,
  resendUserOtp,
  updateUserDetails,
  userGoogleOAuthVerify,
  userSignup,
  userSubscription,
  userVerifyPayment,
  verifyUserContact,
} from "./controller";

export const Mutation = {
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

  userGoogleOAuthVerify,
};
