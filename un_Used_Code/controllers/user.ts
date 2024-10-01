// import { Request, Response } from "express";
// import { tryCatch } from "../middlewares/tryCatch";
// import {
//   ChangeUserPasswordRequest,
//   ForgetUserPasswordRequest,
//   UserLoginRequest,
//   UserSignupRequest,
//   VerifyUserEmailRequest,
// } from "../types/user";
// import {
//   ChangeUserPasswordSchema,
//   ForgetUserPasswordSchema,
//   UserLoginSchema,
//   UserSignupSchema,
//   VerifyUserEmailSchema,
// } from "../schemas/user";
// import { prisma } from "../utils/dbConnect";
// import { randomBytes } from "crypto";
// import { sendEmail } from "../utils/emailService";
// import { hashPassword, verifyPassword } from "../utils/password";
// import { sign } from "jsonwebtoken";

// // * User Signup
// export const userSignup = tryCatch(
//   async (
//     request: Request<unknown, unknown, UserSignupRequest>,
//     response: Response,
//   ) => {
//     const validatedData = UserSignupSchema.parse(request.body);

//     const user = await prisma.user.findFirst({
//       where: { email: validatedData.email, isVerified: true },
//     });

//     const sendOtpEmail = async (
//       userName: string,
//       email: string,
//       otp: string,
//     ) => {
//       const emailSubject = "Confirm Your Email Address";
//       const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;

//       await sendEmail(email, emailSubject, emailText);
//     };

//     if (user) {
//       return response
//         .status(400)
//         .json({ error: "User already exists and email is verified! " });
//     }

//     const otp = randomBytes(3).toString("hex").substring(0, 6);

//     const { salt, hash } = hashPassword(validatedData.password);

//     const newUser = await prisma.user.upsert({
//       where: { email: validatedData.email }, // Find the user by email
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

//     await sendOtpEmail(newUser.name, newUser.email, otp);

//     return response.status(201).json({
//       id: newUser.id,
//       name: newUser.name,
//       email: newUser.email,
//       message: "User created! Please verify your email.",
//     });
//   },
// );

// // * Validate Email
// export const verifyUserEmail = tryCatch(
//   async (
//     request: Request<unknown, unknown, VerifyUserEmailRequest>,
//     response: Response,
//   ) => {
//     const validatedData = VerifyUserEmailSchema.parse(request.body);

//     const user = await prisma.user.findFirst({
//       where: {
//         email: validatedData.email,
//       },
//     });

//     if (!user) {
//       return response.status(400).json({ message: "Email doesn't exist!" });
//     }

//     const currentTime = new Date();

//     if (user.otpExpiresAt! < currentTime) {
//       return response.status(400).json({ message: "OTP has expired." });
//     }

//     if (user.otp! !== validatedData.otp) {
//       return response.status(400).json({ message: "OTP doesn't match!" });
//     }

//     const validatedUser = await prisma.user.update({
//       where: {
//         email: user.email,
//       },
//       data: {
//         isVerified: true,
//       },
//     });

//     const token = sign({ userId: validatedUser.id }, process.env.JWT_SECRET!, {
//       expiresIn: process.env.JWT_EXPIRATION_TIME!,
//     });

//     return response
//       .status(200)
//       .cookie("authToken", token, {
//         httpOnly: true,
//         maxAge:
//           parseInt(process.env.JWT_EXPIRATION_TIME!, 10) * 24 * 60 * 60 * 1000,
//       })
//       .json({
//         id: validatedUser.id,
//         name: validatedUser.name,
//         email: validatedUser.email,
//         message: "User OTP verified!",
//       });
//   },
// );

// // *User Login
// export const userLogin = tryCatch(
//   async (
//     request: Request<unknown, unknown, UserLoginRequest>,
//     response: Response,
//   ) => {
//     const validatedData = UserLoginSchema.parse(request.body);

//     const user = await prisma.user.findFirst({
//       where: { email: validatedData.email },
//     });

//     if (!user) {
//       return response.status(400).json({ massage: "Email doesn't exit!" });
//     }

//     const verify = verifyPassword(
//       validatedData.password,
//       user.salt,
//       user.password,
//     );

//     if (verify) {
//       const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
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
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           massage: "Logged in successful.",
//         });
//     } else {
//       return response.status(400).json({ massage: "Wrong password!" });
//     }
//   },
// );

// // *Forget User Password
// export const forgetUserPassword = tryCatch(
//   async (
//     request: Request<unknown, unknown, ForgetUserPasswordRequest>,
//     response: Response,
//   ) => {
//     const validatedData = ForgetUserPasswordSchema.parse(request.body);

//     const sendOtpEmail = async (
//       userName: string,
//       email: string,
//       otp: string,
//     ) => {
//       const emailSubject = "Password Reset OTP";
//       const emailText = `Hello ${userName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

//       await sendEmail(email, emailSubject, emailText);
//     };

//     const otp = randomBytes(3).toString("hex").substring(0, 6);

//     const user = await prisma.user.update({
//       where: { email: validatedData.email }, // Find the user by email
//       data: {
//         otp: otp,
//         otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       },
//     });

//     await sendOtpEmail(user.name, user.email, otp);

//     return response.status(200).json({
//       massage: `The password reset otp is sent at ${user.email}`,
//     });
//   },
// );

// // *Change User Password
// export const changeUserPassword = tryCatch(
//   async (
//     request: Request<unknown, unknown, ChangeUserPasswordRequest>,
//     response: Response,
//   ) => {
//     const validatedData = ChangeUserPasswordSchema.parse(request.body);

//     const user = await prisma.user.findFirst({
//       where: {
//         email: validatedData.email,
//       },
//     });
//     if (!user) {
//       return response.status(400).json({ massage: "Email doesn't exit!" });
//     }

//     const currentTime = new Date();

//     if (user.otpExpiresAt! < currentTime) {
//       return response.status(400).json({ message: "OTP has expired." });
//     }

//     if (user.otp! !== validatedData.otp) {
//       return response.status(400).json({ message: "OTP doesn't match!" });
//     }

//     const verify = verifyPassword(
//       validatedData.password,
//       user.salt,
//       user.password,
//     );

//     if (verify) {
//       return response
//         .status(400)
//         .json({ message: "Password can't me same as last password." });
//     }

//     const { salt, hash } = hashPassword(validatedData.password);

//     const updatedPassword = await prisma.user.update({
//       where: { email: user.email },
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
