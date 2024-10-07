import {
  addOrUpdateService,
  businessLogin,
  businessSignup,
  changeBusinessPassword,
  forgetBusinessPassword,
  updateBusinessDetails,
  verifyBusinessEmail,
} from "./controller";

export const Mutation = {
  businessSignup,

  verifyBusinessEmail,

  businessLogin,

  forgetBusinessPassword,

  changeBusinessPassword,

  updateBusinessDetails,

  addOrUpdateService,
};
