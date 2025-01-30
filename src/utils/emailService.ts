import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sends an email using the Nodemailer transporter.
 *
 * @param {Object} params - The email parameters.
 * @param {string} params.to - The recipient's email address.
 * @param {string | undefined} params.subject - The subject of the email.
 * @param {string | undefined} params.message - The message body of the email.
 * @returns {Promise<void>} A promise that resolves when the email is sent.
 */

async function sendEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string | undefined;
  message: string | undefined;
}) {
  const mail = {
    from: process.env.SMTP_USERNAME,
    to: [to, process.env.SMTP_USERNAME].join(","),
    subject,
    text: message, // Using 'text' instead of 'message' for Nodemailer
  };
  await transporter.sendMail(mail);
}

export default sendEmail;
