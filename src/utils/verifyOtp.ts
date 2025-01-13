const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const verifyOtp = async (
  requestId: string,
  otp: string
): Promise<{ requestId: string; isOTPVerified: boolean; message: string }> => {
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
      const requestId: string = data?.requestId; // Ensure requestId is a string
      const isOTPVerified: boolean = data?.isVerified; // Default to false if undefined
      const message: string = data?.message; // Default message if missing
      console.log("OTP verified successfully:", data);
      return { requestId, isOTPVerified, message };
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
