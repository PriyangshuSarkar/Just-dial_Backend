"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = void 0;
const crypto_1 = require("crypto");
const db_1 = require("./db");
const dbConnect_1 = require("../../../utils/dbConnect");
const password_1 = require("../../../utils/password");
const emailService_1 = require("../../../utils/emailService");
const jsonwebtoken_1 = require("jsonwebtoken");
exports.Mutation = {
    businessSignup: async (_, args) => {
        const validatedData = db_1.BusinessSignupSchema.parse(args);
        const existingBusiness = await dbConnect_1.prisma.business.findFirst({
            where: { email: validatedData.email, isVerified: true },
        });
        if (existingBusiness) {
            throw new Error("Business already exists and email is verified!");
        }
        const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const newBusiness = await dbConnect_1.prisma.business.upsert({
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
        const sendOtpEmail = async (businessName, email, otp) => {
            const emailSubject = "Confirm Your Email Address";
            const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        await sendOtpEmail(newBusiness.name, newBusiness.email, otp);
        return {
            id: newBusiness.id,
            name: newBusiness.name,
            email: newBusiness.email,
            message: "Business created! Please verify your email.",
        };
    },
    verifyBusinessEmail: async (_, args) => {
        const validatedData = db_1.VerifyBusinessEmailSchema.parse(args);
        const business = await dbConnect_1.prisma.business.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!business) {
            throw new Error("Email doesn't exist!");
        }
        const currentTime = new Date();
        if (business.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (business.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const validatedBusiness = await dbConnect_1.prisma.business.update({
            where: {
                email: business.email,
            },
            data: {
                isVerified: true,
            },
        });
        const token = (0, jsonwebtoken_1.sign)({ businessId: validatedBusiness.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        return {
            id: business.id,
            name: business.name,
            email: business.email,
            message: "Business OTP verified!",
            token: token,
        };
    },
    businessLogin: async (_, args) => {
        const validatedData = db_1.BusinessLoginSchema.parse(args);
        const business = await dbConnect_1.prisma.business.findFirst({
            where: { email: validatedData.email },
        });
        if (!business) {
            throw new Error("Email doesn't exit!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, business.salt, business.password);
        if (verify) {
            const token = (0, jsonwebtoken_1.sign)({ businessId: business.id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            });
            return {
                id: business.id,
                name: business.name,
                email: business.email,
                message: "Logged in successful.",
                token: token,
            };
        }
        else {
            throw new Error("Wrong password!");
        }
    },
    forgetBusinessPassword: async (_, args) => {
        const validatedData = db_1.ForgetBusinessPasswordSchema.parse(args);
        const sendOtpEmail = async (businessName, email, otp) => {
            const emailSubject = "Password Reset OTP";
            const emailText = `Hello ${businessName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
        const business = await dbConnect_1.prisma.business.update({
            where: { email: validatedData.email },
            data: {
                otp: otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        await sendOtpEmail(business.name, business.email, otp);
        return {
            message: `The password reset otp is sent at ${business.email}`,
        };
    },
    changeBusinessPassword: async (_, args) => {
        const validatedData = db_1.ChangeBusinessPasswordSchema.parse(args);
        const business = await dbConnect_1.prisma.business.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!business) {
            throw new Error("Email doesn't exit!");
        }
        const currentTime = new Date();
        if (business.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (business.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, business.salt, business.password);
        if (verify) {
            throw new Error("Password can't me same as last password.");
        }
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const updatedPassword = await dbConnect_1.prisma.business.update({
            where: { email: business.email },
            data: {
                password: hash,
                salt: salt,
            },
        });
        return {
            id: updatedPassword.id,
            name: updatedPassword.name,
            email: updatedPassword.email,
            massage: "Password updated successfully.",
        };
    },
};
//# sourceMappingURL=mutation.js.map