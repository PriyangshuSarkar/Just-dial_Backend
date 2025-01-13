import { OAuth2Client } from "google-auth-library";

export const googleOAuth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const otpApiKey = process.env.OTPLESS_API_KEY!;
const otpApiSecret = process.env.OTPLESS_SECRET!;

export const initiateOAuth = async (
  redirectURI: string
): Promise<{ requestId: string; link: string }> => {
  const options = {
    method: "POST",
    headers: {
      clientId: otpApiKey,
      clientSecret: otpApiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: "GOOGLE", // Specify the communication channel (WhatsApp in this case)
      redirectURI, // Your redirect URI after OAuth is successful
    }),
  };

  try {
    const response = await fetch(
      "https://auth.otpless.app/auth/v1/initiate/oauth",
      options
    );
    if (response.ok) {
      const data = await response.json();
      const requestId = data.requestId;
      const link = data.link;
      console.log("OAuth initiation successful:", data);
      return { requestId, link };
    } else {
      const errorData = await response.json();
      console.error("Error initiating OAuth:", errorData);
      throw new Error(`Failed to initiate OAuth: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error during OAuth initiation:", error);
    throw new Error("Failed to initiate OAuth");
  }
};
