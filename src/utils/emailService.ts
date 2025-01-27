import { infer as infer_, object, string } from "zod";

const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;
const otpLength = process.env.OTP_LENGTH || 6;

export const SendOtpEmailResponseSchema = object({
  requestId: string(),
});
export type SendOtpEmailResponse = infer_<typeof SendOtpEmailResponseSchema>;

export const sendOtpEmail = async (
  userName: string | null,
  email: string,
  expiry: number
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
      expiry: (expiry * 60) / 5, // OTP expiry time in seconds
      otpLength, // Length of the OTP
      channels: ["EMAIL"],
      metadata: {
        userName,
      },
    }),
  };

  console.log(options);

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
