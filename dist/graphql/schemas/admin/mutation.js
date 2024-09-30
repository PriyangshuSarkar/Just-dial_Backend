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
    adminSignup: async (_, args) => {
        const validatedData = db_1.AdminSignupSchema.parse(args);
        const existingAdmin = await dbConnect_1.prisma.admin.findFirst({
            where: { email: validatedData.email, isVerified: true },
        });
        if (existingAdmin) {
            throw new Error("Admin already exists and email is verified!");
        }
        const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const newAdmin = await dbConnect_1.prisma.admin.upsert({
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
        const sendOtpEmail = async (adminName, email, otp) => {
            const emailSubject = "Confirm Your Email Address";
            const emailText = `Hello ${adminName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        await sendOtpEmail(newAdmin.name, newAdmin.email, otp);
        return {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            message: "Admin created! Please verify your email.",
        };
    },
    verifyAdminEmail: async (_, args) => {
        const validatedData = db_1.VerifyAdminEmailSchema.parse(args);
        const admin = await dbConnect_1.prisma.admin.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!admin) {
            throw new Error("Email doesn't exist!");
        }
        const currentTime = new Date();
        if (admin.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (admin.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const validatedAdmin = await dbConnect_1.prisma.admin.update({
            where: {
                email: admin.email,
            },
            data: {
                isVerified: true,
            },
        });
        const token = (0, jsonwebtoken_1.sign)({ adminId: validatedAdmin.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            message: "Admin OTP verified!",
            token: token,
        };
    },
    adminLogin: async (_, args) => {
        const validatedData = db_1.AdminLoginSchema.parse(args);
        const admin = await dbConnect_1.prisma.admin.findFirst({
            where: { email: validatedData.email },
        });
        if (!admin) {
            throw new Error("Email doesn't exit!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, admin.salt, admin.password);
        if (verify) {
            const token = (0, jsonwebtoken_1.sign)({ adminId: admin.id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            });
            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                message: "Logged in successful.",
                token: token,
            };
        }
        else {
            throw new Error("Wrong password!");
        }
    },
    forgetAdminPassword: async (_, args) => {
        const validatedData = db_1.ForgetAdminPasswordSchema.parse(args);
        const sendOtpEmail = async (adminName, email, otp) => {
            const emailSubject = "Password Reset OTP";
            const emailText = `Hello ${adminName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
        const admin = await dbConnect_1.prisma.admin.update({
            where: { email: validatedData.email },
            data: {
                otp: otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        await sendOtpEmail(admin.name, admin.email, otp);
        return {
            message: `The password reset otp is sent at ${admin.email}`,
        };
    },
    changeAdminPassword: async (_, args) => {
        const validatedData = db_1.ChangeAdminPasswordSchema.parse(args);
        const admin = await dbConnect_1.prisma.admin.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!admin) {
            throw new Error("Email doesn't exit!");
        }
        const currentTime = new Date();
        if (admin.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (admin.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, admin.salt, admin.password);
        if (verify) {
            throw new Error("Password can't me same as last password.");
        }
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const updatedPassword = await dbConnect_1.prisma.admin.update({
            where: { email: admin.email },
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