// import { Request, Response } from "express";
// import { tryCatch } from "../middlewares/tryCatch";

// import { prisma } from "../utils/dbConnect";
// import { randomBytes } from "crypto";
// import { sendEmail } from "../utils/emailService";
// import { hashPassword, verifyPassword } from "../utils/password";
// import { sign } from "jsonwebtoken";
// import {
//   BusinessLoginRequest,
//   BusinessSignupRequest,
//   ChangeBusinessPasswordRequest,
//   ForgetBusinessPasswordRequest,
//   VerifyBusinessEmailRequest,
// } from "../types/business";
// import {
//   BusinessLoginSchema,
//   BusinessSignupSchema,
//   ChangeBusinessPasswordSchema,
//   ForgetBusinessPasswordSchema,
//   VerifyBusinessEmailSchema,
// } from "../schemas/business";

// // * Business Signup
// export const businessSignup = tryCatch(
//   async (
//     request: Request<unknown, unknown, BusinessSignupRequest>,
//     response: Response,
//   ) => {
//     const validatedData = BusinessSignupSchema.parse(request.body);

//     const business = await prisma.business.findFirst({
//       where: { email: validatedData.email, isVerified: true },
//     });

//     const sendOtpEmail = async (
//       businessName: string,
//       email: string,
//       otp: string,
//     ) => {
//       const emailSubject = "Confirm Your Email Address";
//       const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;

//       await sendEmail(email, emailSubject, emailText);
//     };

//     if (business) {
//       return response
//         .status(400)
//         .json({ error: "Business already exists and email is verified! " });
//     }

//     const otp = randomBytes(3).toString("hex").substring(0, 6);

//     const { salt, hash } = hashPassword(validatedData.password);

//     const newBusiness = await prisma.business.upsert({
//       where: { email: validatedData.email }, // Find the business by email
//       update: {
//         name: validatedData.name,
//         password: hash,
//         salt: salt,
//         deletedAt: null,
//         otp: otp,
//         otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       },
//       create: {
//         name: validatedData.name,
//         email: validatedData.email,
//         password: hash,
//         salt: salt,
//         otp: otp,
//         otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       },
//     });

//     await sendOtpEmail(newBusiness.name, newBusiness.email, otp);

//     return response.status(201).json({
//       id: newBusiness.id,
//       name: newBusiness.name,
//       email: newBusiness.email,
//       message: "Business created! Please verify your email.",
//     });
//   },
// );

// // * Validate Email
// export const verifyBusinessEmail = tryCatch(
//   async (
//     request: Request<unknown, unknown, VerifyBusinessEmailRequest>,
//     response: Response,
//   ) => {
//     const validatedData = VerifyBusinessEmailSchema.parse(request.body);

//     const business = await prisma.business.findFirst({
//       where: {
//         email: validatedData.email,
//       },
//     });

//     if (!business) {
//       return response.status(400).json({ message: "Email doesn't exist!" });
//     }

//     const currentTime = new Date();

//     if (business.otpExpiresAt! < currentTime) {
//       return response.status(400).json({ message: "OTP has expired." });
//     }

//     if (business.otp! !== validatedData.otp) {
//       return response.status(400).json({ message: "OTP doesn't match!" });
//     }

//     const validatedBusiness = await prisma.business.update({
//       where: {
//         email: business.email,
//       },
//       data: {
//         isVerified: true,
//       },
//     });

//     const token = sign(
//       { businessId: validatedBusiness.id },
//       process.env.JWT_SECRET!,
//       {
//         expiresIn: process.env.JWT_EXPIRATION_TIME!,
//       },
//     );

//     return response
//       .status(200)
//       .cookie("authToken", token, {
//         httpOnly: true,
//         maxAge:
//           parseInt(process.env.JWT_EXPIRATION_TIME!, 10) * 24 * 60 * 60 * 1000,
//       })
//       .json({
//         id: validatedBusiness.id,
//         name: validatedBusiness.name,
//         email: validatedBusiness.email,
//         message: "Business OTP verified!",
//       });
//   },
// );

// // *Business Login
// export const businessLogin = tryCatch(
//   async (
//     request: Request<unknown, unknown, BusinessLoginRequest>,
//     response: Response,
//   ) => {
//     const validatedData = BusinessLoginSchema.parse(request.body);

//     const business = await prisma.business.findFirst({
//       where: { email: validatedData.email },
//     });

//     if (!business) {
//       return response.status(400).json({ massage: "Email doesn't exit!" });
//     }

//     const verify = verifyPassword(
//       validatedData.password,
//       business.salt,
//       business.password,
//     );

//     if (verify) {
//       const token = sign({ businessId: business.id }, process.env.JWT_SECRET!, {
//         expiresIn: process.env.JWT_EXPIRATION_TIME!,
//       });

//       return response
//         .status(200)
//         .cookie("authToken", token, {
//           httpOnly: true,
//           maxAge:
//             parseInt(process.env.JWT_EXPIRATION_TIME!, 10) *
//             24 *
//             60 *
//             60 *
//             1000,
//         })
//         .json({
//           id: business.id,
//           name: business.name,
//           email: business.email,
//           massage: "Logged in successful.",
//         });
//     } else {
//       return response.status(400).json({ massage: "Wrong password!" });
//     }
//   },
// );

// // *Forget Business Password
// export const forgetBusinessPassword = tryCatch(
//   async (
//     request: Request<unknown, unknown, ForgetBusinessPasswordRequest>,
//     response: Response,
//   ) => {
//     const validatedData = ForgetBusinessPasswordSchema.parse(request.body);

//     const sendOtpEmail = async (
//       businessName: string,
//       email: string,
//       otp: string,
//     ) => {
//       const emailSubject = "Confirm Your Email Address";
//       const emailText = `Hello ${businessName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

//       await sendEmail(email, emailSubject, emailText);
//     };

//     const otp = randomBytes(3).toString("hex").substring(0, 6);

//     const business = await prisma.business.update({
//       where: { email: validatedData.email }, // Find the business by email
//       data: {
//         otp: otp,
//         otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       },
//     });

//     await sendOtpEmail(business.name, business.email, otp);

//     return response.status(200).json({
//       id: business.id,
//       name: business.name,
//       email: business.email,
//       massage: "Password updated successfully.",
//     });
//   },
// );

// // *Change Business Password
// export const changeBusinessPassword = tryCatch(
//   async (
//     request: Request<unknown, unknown, ChangeBusinessPasswordRequest>,
//     response: Response,
//   ) => {
//     const validatedData = ChangeBusinessPasswordSchema.parse(request.body);

//     const business = await prisma.business.findFirst({
//       where: {
//         email: validatedData.email,
//       },
//     });
//     if (!business) {
//       return response.status(400).json({ massage: "Email doesn't exit!" });
//     }

//     const currentTime = new Date();

//     if (business.otpExpiresAt! < currentTime) {
//       return response.status(400).json({ message: "OTP has expired." });
//     }

//     if (business.otp! !== validatedData.otp) {
//       return response.status(400).json({ message: "OTP doesn't match!" });
//     }

//     const verify = verifyPassword(
//       validatedData.password,
//       business.salt,
//       business.password,
//     );

//     if (verify) {
//       return response
//         .status(400)
//         .json({ message: "Password can't me same as last password." });
//     }

//     const { salt, hash } = hashPassword(validatedData.password);

//     const updatedPassword = await prisma.business.update({
//       where: { email: business.email },
//       data: {
//         password: hash,
//         salt: salt,
//       },
//     });

//     return response.status(200).json({
//       id: updatedPassword.id,
//       name: updatedPassword.name,
//       email: updatedPassword.email,
//       massage: "Password updated successfully.",
//     });
//   },
// );
