"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAdminPassword = exports.forgetAdminPassword = exports.adminLogin = exports.verifyAdminEmail = exports.adminSignup = void 0;
const tryCatch_1 = require("../middlewares/tryCatch");
const admin_1 = require("../schemas/admin");
const dbConnect_1 = require("../utils/dbConnect");
const crypto_1 = require("crypto");
const emailService_1 = require("../utils/emailService");
const password_1 = require("../utils/password");
const jsonwebtoken_1 = require("jsonwebtoken");
exports.adminSignup = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = admin_1.AdminSignupSchema.parse(request.body);
    const admin = await dbConnect_1.prisma.admin.findFirst({
        where: { email: validatedData.email, isVerified: true },
    });
    const sendOtpEmail = async (adminName, email, otp) => {
        const emailSubject = "Confirm Your Email Address";
        const emailText = `Hello ${adminName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
        await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
    };
    if (admin) {
        return response
            .status(400)
            .json({ error: "Admin already exists and email is verified! " });
    }
    const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const newAdmin = await dbConnect_1.prisma.admin.upsert({
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
    await sendOtpEmail(newAdmin.name, newAdmin.email, otp);
    return response.status(201).json({
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        message: "Admin created! Please verify your email.",
    });
});
exports.verifyAdminEmail = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = admin_1.VerifyAdminEmailSchema.parse(request.body);
    const admin = await dbConnect_1.prisma.admin.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!admin) {
        return response.status(400).json({ message: "Email doesn't exist!" });
    }
    const currentTime = new Date();
    if (admin.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (admin.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
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
    return response
        .status(200)
        .cookie("authToken", token, {
        httpOnly: true,
        maxAge: parseInt(process.env.JWT_EXPIRATION_TIME, 10) * 24 * 60 * 60 * 1000,
    })
        .json({
        id: validatedAdmin.id,
        name: validatedAdmin.name,
        email: validatedAdmin.email,
        message: "Admin OTP verified!",
    });
});
exports.adminLogin = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = admin_1.AdminLoginSchema.parse(request.body);
    const admin = await dbConnect_1.prisma.admin.findFirst({
        where: { email: validatedData.email },
    });
    if (!admin) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, admin.salt, admin.password);
    if (verify) {
        const token = (0, jsonwebtoken_1.sign)({ adminId: admin.id }, process.env.JWT_SECRET, {
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
            id: admin.id,
            name: admin.name,
            email: admin.email,
            massage: "Logged in successful.",
        });
    }
    else {
        return response.status(400).json({ massage: "Wrong password!" });
    }
});
exports.forgetAdminPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = admin_1.ForgetAdminPasswordSchema.parse(request.body);
    const sendOtpEmail = async (adminName, email, otp) => {
        const emailSubject = "Confirm Your Email Address";
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
    return response.status(200).json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        massage: "Password updated successfully.",
    });
});
exports.changeAdminPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = admin_1.ChangeAdminPasswordSchema.parse(request.body);
    const admin = await dbConnect_1.prisma.admin.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!admin) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const currentTime = new Date();
    if (admin.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (admin.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, admin.salt, admin.password);
    if (verify) {
        return response
            .status(400)
            .json({ message: "Password can't me same as last password." });
    }
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const updatedPassword = await dbConnect_1.prisma.admin.update({
        where: { email: admin.email },
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
//# sourceMappingURL=admin.js.map