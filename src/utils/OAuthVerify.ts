const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const verifyCode = async (
  code: string
): Promise<{
  requestId: string;
  message: string;
  userDetails: object;
  deviceInfo: object;
}> => {
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code, // The verification code entered by the user
    }),
  };

  try {
    const response = await fetch(
      "https://auth.otpless.app/auth/v1/verify/code",
      options
    );
    if (response.ok) {
      const data = await response.json();
      const requestId: string = data.requestId;
      const message: string = data.message;
      const userDetails: object = data.userDetails;
      const deviceInfo: object = data.deviceInfo;
      console.log("Code verified successfully:", data);
      return { requestId, message, userDetails, deviceInfo };
    } else {
      const errorData = await response.json();
      console.error("Error verifying code:", errorData);
      throw new Error(`Failed to verify code: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error during code verification:", error);
    throw new Error("Failed to verify code");
  }
};
