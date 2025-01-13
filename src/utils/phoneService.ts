const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const sendOtpPhone = async (
  userName: string | null,
  phone: string
): Promise<{ requestId: string }> => {
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: phone,
      expiry: 30, // OTP expiry time in minutes
      otpLength: 4, // Length of the OTP
      channels: ["WHATSAPP", "SMS"], // Send via WhatsApp and SMS
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
