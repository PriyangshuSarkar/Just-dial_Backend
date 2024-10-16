import {
  addService,
  businessLogin,
  businessSignup,
  changeBusinessPassword,
  forgetBusinessPassword,
  removeService,
  updateBusinessDetails,
  updateService,
  verifyBusinessEmail,
} from "./controller";

export const Mutation = {
  businessSignup,

  verifyBusinessEmail,

  businessLogin,

  forgetBusinessPassword,

  changeBusinessPassword,

  updateBusinessDetails,

  addService,

  updateService,

  removeService,
};
