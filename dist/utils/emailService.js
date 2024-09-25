"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.transporter = void 0;
const nodemailer_1 = require("nodemailer");
exports.transporter = (0, nodemailer_1.createTransport)({
    host: process.env.EMAIL_HOST,
    port: +process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };
    try {
        await exports.transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send verification email");
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailService.js.map