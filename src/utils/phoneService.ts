import { infer as infer_, object, string } from "zod";

const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;
const otpLength = process.env.OTP_LENGTH || 6;

export const SendOtpPhoneResponseSchema = object({
  requestId: string(),
});
export type SendOtpPhoneResponse = infer_<typeof SendOtpPhoneResponseSchema>;

export const sendOtpPhone = async (
  userName: string | null,
  phone: string,
  expiry: number
): Promise<SendOtpPhoneResponse> => {
  return {
    requestId: "test",
  };
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: phone,
      expiry, // OTP expiry time in minutes
      otpLength, // Length of the OTP
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
      console.log("OTP request initiated successfully:", data);
      return data;
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
