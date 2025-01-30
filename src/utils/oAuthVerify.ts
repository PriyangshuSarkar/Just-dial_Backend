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
    identities: object({
      identityType: string(),
      identityValue: string(),
      channel: string(),
      methods: string().array(),
      name: string().optional(), // Moved name inside identities
      verified: boolean(),
      verifiedTimestamp: number(), // Timestamp in milliseconds
      picture: string().optional(), // Added picture field
      isCompanyEmail: boolean().optional(), // Added isCompanyEmail field
      providerMetadata: object({
        email: string().optional(),
        nonce: string().optional(),
        isEmailVerified: boolean().optional(),
        name: string().optional(),
        picture: string().optional(),
      }).optional(), // Added providerMetadata field
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
