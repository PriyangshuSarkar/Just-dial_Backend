const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const sendOtpEmail = async (
  userName: string | null,
  email: string
): Promise<{ requestId: string }> => {
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      expiry: 30, // OTP expiry time in minutes
      otpLength: 4, // Length of the OTP
      channels: ["EMAIL"],
      metadata: {
        userName,
      },
    }),
  };

  try {
    const response = await fetch(
      "https://auth.otpless.app/auth/v1/initiate/otp",
      options
    );
    if (response.ok) {
      const data = await response.json();
      const requestId: string = data.requestId; // Ensuring requestId is a string
      console.log("OTP request initiated successfully:", requestId);
      return { requestId };
    } else {
      const errorData = await response.json();
      console.error("Error initiating OTP request:", errorData);
      throw new Error(`Failed to send OTP: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};
