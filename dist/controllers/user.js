"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserPassword = exports.forgetUserPassword = exports.userLogin = exports.verifyUserEmail = exports.userSignup = void 0;
const tryCatch_1 = require("../middlewares/tryCatch");
const user_1 = require("../schemas/user");
const dbConnect_1 = require("../utils/dbConnect");
const crypto_1 = require("crypto");
const emailService_1 = require("../utils/emailService");
const password_1 = require("../utils/password");
const jsonwebtoken_1 = require("jsonwebtoken");
exports.userSignup = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = user_1.UserSignupSchema.parse(request.body);
    const user = await dbConnect_1.prisma.user.findFirst({
        where: { email: validatedData.email, isVerified: true },
    });
    const sendOtpEmail = async (userName, email, otp) => {
        const emailSubject = "Confirm Your Email Address";
        const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
        await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
    };
    if (user) {
        return response
            .status(400)
            .json({ error: "User already exists and email is verified! " });
    }
    const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const newUser = await dbConnect_1.prisma.user.upsert({
        where: { email: validatedData.email },
        update: {
            name: validatedData.name,
            password: hash,
            salt: salt,
            deletedAt: null,
            otp: otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        create: {
            name: validatedData.name,
            email: validatedData.email,
            password: hash,
            salt: salt,
            otp: otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });
    await sendOtpEmail(newUser.name, newUser.email, otp);
    return response.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        message: "User created! Please verify your email.",
    });
});
exports.verifyUserEmail = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = user_1.VerifyUserEmailSchema.parse(request.body);
    const user = await dbConnect_1.prisma.user.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!user) {
        return response.status(400).json({ message: "Email doesn't exist!" });
    }
    const currentTime = new Date();
    if (user.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (user.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
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
    return response
        .status(200)
        .cookie("authToken", token, {
        httpOnly: true,
        maxAge: parseInt(process.env.JWT_EXPIRATION_TIME, 10) * 24 * 60 * 60 * 1000,
    })
        .json({
        id: validatedUser.id,
        name: validatedUser.name,
        email: validatedUser.email,
        message: "User OTP verified!",
    });
});
exports.userLogin = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = user_1.UserLoginSchema.parse(request.body);
    const user = await dbConnect_1.prisma.user.findFirst({
        where: { email: validatedData.email },
    });
    if (!user) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, user.salt, user.password);
    if (verify) {
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        return response
            .status(200)
            .cookie("authToken", token, {
            httpOnly: true,
            maxAge: parseInt(process.env.JWT_EXPIRATION_TIME, 10) *
                24 *
                60 *
                60 *
                1000,
        })
            .json({
            id: user.id,
            name: user.name,
            email: user.email,
            massage: "Logged in successful.",
        });
    }
    else {
        return response.status(400).json({ massage: "Wrong password!" });
    }
});
exports.forgetUserPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = user_1.ForgetUserPasswordSchema.parse(request.body);
    const sendOtpEmail = async (userName, email, otp) => {
        const emailSubject = "Password Reset OTP";
        const emailText = `Hello ${userName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;
        await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
    };
    const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
    const user = await dbConnect_1.prisma.user.update({
        where: { email: validatedData.email },
        data: {
            otp: otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });
    await sendOtpEmail(user.name, user.email, otp);
    return response.status(200).json({
        massage: `The password reset otp is sent at ${user.email}`,
    });
});
exports.changeUserPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = user_1.ChangeUserPasswordSchema.parse(request.body);
    const user = await dbConnect_1.prisma.user.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!user) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const currentTime = new Date();
    if (user.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (user.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, user.salt, user.password);
    if (verify) {
        return response
            .status(400)
            .json({ message: "Password can't me same as last password." });
    }
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const updatedPassword = await dbConnect_1.prisma.user.update({
        where: { email: user.email },
        data: {
            password: hash,
            salt: salt,
        },
    });
    return response.status(200).json({
        id: updatedPassword.id,
        name: updatedPassword.name,
        email: updatedPassword.email,
        massage: "Password updated successfully.",
    });
});
//# sourceMappingURL=user.js.map