import { object, string, number, boolean, infer as infer_ } from "zod";

const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const OAuthVerifyResponseSchema = object({
  requestId: string(),
  message: string(),
  userDetails: object({
    token: string(),
    status: string(),
    completedAt: number(), // Timestamp in milliseconds
    name: string().optional(),
    identities: object({
      identityType: string(),
      identityValue: string(),
      channel: string(),
      methods: string().array(),
      verified: boolean(),
      verifiedTimestamp: number(), // Timestamp in milliseconds
    }).array(),
    network: object({
      ip: string(), // IPv4 or IPv6 address
    }),
    deviceInfo: object({
      userAgent: string(),
      platform: string(),
      vendor: string(),
      language: string(),
      cookieEnabled: boolean(),
      screenWidth: number(),
      screenHeight: number(),
      screenColorDepth: number(),
      devicePixelRatio: number(),
    }),
  }),
});

export type OAuthVerifyResponse = infer_<typeof OAuthVerifyResponseSchema>;
export const verifyCode = async (
  code: string
): Promise<OAuthVerifyResponse> => {
  return {
    requestId: "test",
    message: "Verification successful",
    userDetails: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      status: "verified",
      completedAt: 1708003200000,
      name: "John Doe",
      identities: [
        {
          identityType: "email",
          identityValue: "john.doe@example.com",
          channel: "email",
          methods: ["OTP", "password"],
          verified: true,
          verifiedTimestamp: 1708003200000,
        },
        {
          identityType: "phone",
          identityValue: "+1234567890",
          channel: "sms",
          methods: ["OTP"],
          verified: false,
          verifiedTimestamp: 123456,
        },
      ],
      network: {
        ip: "192.168.1.100",
      },
      deviceInfo: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        platform: "Windows",
        vendor: "Google Inc.",
        language: "en-US",
        cookieEnabled: true,
        screenWidth: 1920,
        screenHeight: 1080,
        screenColorDepth: 24,
        devicePixelRatio: 1.5,
      },
    },
  };
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
      console.log("Code verified successfully:", data);
      return data;
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
