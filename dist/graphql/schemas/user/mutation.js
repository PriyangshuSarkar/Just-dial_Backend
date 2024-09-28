"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = void 0;
const crypto_1 = require("crypto");
const db_1 = require("./db");
const dbConnect_1 = require("../../../utils/dbConnect");
const password_1 = require("../../../utils/password");
const emailService_1 = require("../../../utils/emailService");
exports.Mutation = {
    signup: async (_, args) => {
        const validatedData = db_1.UserSignupSchema.parse(args);
        const existingUser = await dbConnect_1.prisma.user.findFirst({
            where: { email: validatedData.email, isVerified: true },
        });
        if (existingUser) {
            throw new Error("User already exists and email is verified!");
        }
        const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const newUser = await dbConnect_1.prisma.user.upsert({
            where: { email: validatedData.email },
            update: {
                name: validatedData.name,
                password: hash,
                salt,
                deletedAt: null,
                otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
            create: {
                name: validatedData.name,
                email: validatedData.email,
                password: hash,
                salt,
                otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        await sendOtpEmail(newUser.name, newUser.email, otp);
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            message: "User created! Please verify your email.",
        };
    },
};
const sendOtpEmail = async (userName, email, otp) => {
    const emailSubject = "Confirm Your Email Address";
    const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
    await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
};
//# sourceMappingURL=mutation.js.map