"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeBusinessPassword = exports.forgetBusinessPassword = exports.businessLogin = exports.verifyBusinessEmail = exports.businessSignup = void 0;
const tryCatch_1 = require("../middlewares/tryCatch");
const dbConnect_1 = require("../utils/dbConnect");
const crypto_1 = require("crypto");
const emailService_1 = require("../utils/emailService");
const password_1 = require("../utils/password");
const jsonwebtoken_1 = require("jsonwebtoken");
const business_1 = require("../schemas/business");
exports.businessSignup = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = business_1.BusinessSignupSchema.parse(request.body);
    const business = await dbConnect_1.prisma.business.findFirst({
        where: { email: validatedData.email, isVerified: true },
    });
    const sendOtpEmail = async (businessName, email, otp) => {
        const emailSubject = "Confirm Your Email Address";
        const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
        await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
    };
    if (business) {
        return response
            .status(400)
            .json({ error: "Business already exists and email is verified! " });
    }
    const otp = (0, crypto_1.randomBytes)(3).toString("hex").substring(0, 6);
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const newBusiness = await dbConnect_1.prisma.business.upsert({
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
    await sendOtpEmail(newBusiness.name, newBusiness.email, otp);
    return response.status(201).json({
        id: newBusiness.id,
        name: newBusiness.name,
        email: newBusiness.email,
        message: "Business created! Please verify your email.",
    });
});
exports.verifyBusinessEmail = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = business_1.VerifyBusinessEmailSchema.parse(request.body);
    const business = await dbConnect_1.prisma.business.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!business) {
        return response.status(400).json({ message: "Email doesn't exist!" });
    }
    const currentTime = new Date();
    if (business.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (business.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
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
    return response
        .status(200)
        .cookie("authToken", token, {
        httpOnly: true,
        maxAge: parseInt(process.env.JWT_EXPIRATION_TIME, 10) * 24 * 60 * 60 * 1000,
    })
        .json({
        id: validatedBusiness.id,
        name: validatedBusiness.name,
        email: validatedBusiness.email,
        message: "Business OTP verified!",
    });
});
exports.businessLogin = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = business_1.BusinessLoginSchema.parse(request.body);
    const business = await dbConnect_1.prisma.business.findFirst({
        where: { email: validatedData.email },
    });
    if (!business) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, business.salt, business.password);
    if (verify) {
        const token = (0, jsonwebtoken_1.sign)({ businessId: business.id }, process.env.JWT_SECRET, {
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
            id: business.id,
            name: business.name,
            email: business.email,
            massage: "Logged in successful.",
        });
    }
    else {
        return response.status(400).json({ massage: "Wrong password!" });
    }
});
exports.forgetBusinessPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = business_1.ForgetBusinessPasswordSchema.parse(request.body);
    const sendOtpEmail = async (businessName, email, otp) => {
        const emailSubject = "Confirm Your Email Address";
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
    return response.status(200).json({
        id: business.id,
        name: business.name,
        email: business.email,
        massage: "Password updated successfully.",
    });
});
exports.changeBusinessPassword = (0, tryCatch_1.tryCatch)(async (request, response) => {
    const validatedData = business_1.ChangeBusinessPasswordSchema.parse(request.body);
    const business = await dbConnect_1.prisma.business.findFirst({
        where: {
            email: validatedData.email,
        },
    });
    if (!business) {
        return response.status(400).json({ massage: "Email doesn't exit!" });
    }
    const currentTime = new Date();
    if (business.otpExpiresAt < currentTime) {
        return response.status(400).json({ message: "OTP has expired." });
    }
    if (business.otp !== validatedData.otp) {
        return response.status(400).json({ message: "OTP doesn't match!" });
    }
    const verify = (0, password_1.verifyPassword)(validatedData.password, business.salt, business.password);
    if (verify) {
        return response
            .status(400)
            .json({ message: "Password can't me same as last password." });
    }
    const { salt, hash } = (0, password_1.hashPassword)(validatedData.password);
    const updatedPassword = await dbConnect_1.prisma.business.update({
        where: { email: business.email },
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
//# sourceMappingURL=business.js.map