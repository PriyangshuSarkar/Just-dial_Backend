"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = void 0;
const crypto_1 = require("crypto");
const db_1 = require("./db");
const dbConnect_1 = require("../../../utils/dbConnect");
const password_1 = require("../../../utils/password");
const emailService_1 = require("../../../utils/emailService");
const jsonwebtoken_1 = require("jsonwebtoken");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
exports.Mutation = {
    userSignup: async (_, args) => {
        const validatedData = db_1.UserSignupSchema.parse(args);
        const existingUser = await dbConnect_1.prisma.user.findFirst({
            where: { email: validatedData.email, isVerified: true },
        });
        if (existingUser) {
            throw new Error("User already exists and email is verified!");
        }
        const otp = (parseInt((0, crypto_1.randomBytes)(3).toString("hex"), 16) % 1000000)
            .toString()
            .padStart(6, "0");
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
        const sendOtpEmail = async (userName, email, otp) => {
            const emailSubject = "Confirm Your Email Address";
            const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        await sendOtpEmail(newUser.name, newUser.email, otp);
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            message: "User created! Please verify your email.",
        };
    },
    verifyUserEmail: async (_, args) => {
        const validatedData = db_1.VerifyUserEmailSchema.parse(args);
        const user = await dbConnect_1.prisma.user.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!user) {
            throw new Error("Email doesn't exist!");
        }
        const currentTime = new Date();
        if (user.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (user.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const validatedUser = await dbConnect_1.prisma.user.update({
            where: {
                email: user.email,
            },
            data: {
                isVerified: true,
            },
        });
        const token = (0, jsonwebtoken_1.sign)({ userId: validatedUser.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            message: "User OTP verified!",
            token: token,
        };
    },
    userLogin: async (_, args) => {
        const validatedData = db_1.UserLoginSchema.parse(args);
        const user = await dbConnect_1.prisma.user.findFirst({
            where: { email: validatedData.email },
        });
        if (!user) {
            throw new Error("Email doesn't exit!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, user.salt, user.password);
        if (verify) {
            const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            });
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                message: "Logged in successful.",
                token: token,
            };
        }
        else {
            throw new Error("Wrong password!");
        }
    },
    forgetUserPassword: async (_, args) => {
        const validatedData = db_1.ForgetUserPasswordSchema.parse(args);
        const sendOtpEmail = async (userName, email, otp) => {
            const emailSubject = "Password Reset OTP";
            const emailText = `Hello ${userName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;
            await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
        };
        const otp = (parseInt((0, crypto_1.randomBytes)(3).toString("hex"), 16) % 1000000)
            .toString()
            .padStart(6, "0");
        const user = await dbConnect_1.prisma.user.update({
            where: { email: validatedData.email },
            data: {
                otp: otp,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
        await sendOtpEmail(user.name, user.email, otp);
        return {
            message: `The password reset otp is sent at ${user.email}`,
        };
    },
    changeUserPassword: async (_, args) => {
        const validatedData = db_1.ChangeUserPasswordSchema.parse(args);
        const user = await dbConnect_1.prisma.user.findFirst({
            where: {
                email: validatedData.email,
            },
        });
        if (!user) {
            throw new Error("Email doesn't exit!");
        }
        const currentTime = new Date();
        if (user.otpExpiresAt < currentTime) {
            throw new Error("OTP has expired.");
        }
        if (user.otp !== validatedData.otp) {
            throw new Error("OTP doesn't match!");
        }
        const verify = (0, password_1.verifyPassword)(validatedData.password, user.salt, user.password);
        if (verify) {
            throw new Error("Password can't me same as last password.");
        }
        const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
        const updatedPassword = await dbConnect_1.prisma.user.update({
            where: { email: user.email },
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
    uploadImage: async (_, { file }) => {
        const validatedData = db_1.FileUploadSchema.parse(file);
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream((error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            validatedData.createReadStream().pipe(stream);
        });
        return {
            url: result.url,
            publicId: result.public_id,
        };
    },
};
//# sourceMappingURL=mutation.js.map