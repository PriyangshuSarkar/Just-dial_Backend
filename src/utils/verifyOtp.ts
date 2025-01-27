import { boolean, infer as infer_, object, string } from "zod";

const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const VerifyOtpResponseSchema = object({
  requestId: string(),
  isOTPVerified: boolean(),
  message: string(),
});
export type VerifyOtpResponse = infer_<typeof VerifyOtpResponseSchema>;
export const verifyOtp = async (
  requestId: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestId,
      otp,
    }),
  };

  try {
    const response = await fetch(
      "https://auth.otpless.app/auth/v1/verify/otp",
      options
    );
    if (response.ok) {
      const data = await response.json();
      console.log("OTP verified successfully:", data);
      return data;
    } else {
      const errorData = await response.json();
      const errorMessage = errorData?.message || "Unknown error occurred";
      console.error("Error verifying OTP:", errorMessage);
      throw new Error(`Failed to verify OTP: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    throw new Error("Failed to verify OTP");
  }
};
