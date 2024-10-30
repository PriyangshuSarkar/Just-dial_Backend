import { createTransport } from "nodemailer";

export const transporter = createTransport({
  host: process.env.EMAIL_HOST, // or any other email service
  port: +process.env.EMAIL_PORT!,
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export const sendOtpEmail = async (
  userName: string,
  email: string,
  otp: string
): Promise<void> => {
  const emailSubject = "Confirm Your Email Address";
  const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
  await sendEmail(email, emailSubject, emailText);
};
