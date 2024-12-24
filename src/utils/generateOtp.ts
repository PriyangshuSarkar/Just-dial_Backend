// import { randomBytes } from "crypto";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);

export const generateOtp = (): string => {
  // return (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
  //   .toString()
  //   .padStart(6, "0");
  return (123456).toString();
};

export const createOtpData = () => ({
  otp: generateOtp(),
  otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
});
