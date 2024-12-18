// import twilio from "twilio";

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// export const sendSms = async (to: string, body: string) => {
//   const smsOptions = {
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to,
//     body,
//   };
//   try {
//     await client.messages.create(smsOptions);
//   } catch (error) {
//     console.error("Failed sending SMS:", error);
//     throw new Error("Failed to send SMS");
//   }
// };

// export const sendOtpPhone = async (
//   userName: string | null,
//   phone: string,
//   otp: string
// ): Promise<void> => {
//   const body = `Hello ${userName},\n\nPlease confirm your phone number by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
//   await sendSms(phone, body);
// };
