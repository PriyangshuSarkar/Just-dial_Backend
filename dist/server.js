"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const dotenv_1 = require("dotenv");
const dbConnect_1 = require("./utils/dbConnect");
const crypto_1 = require("crypto");
const password_1 = require("./utils/password");
const emailService_1 = require("./utils/emailService");
const user_1 = require("./schemas/user");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    message: String!
  }

  type Query {
    status: String!
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): User!
  }
`;
const resolvers = {
    Query: {
        status: () => "Server is running",
    },
    Mutation: {
        signup: async (_, args) => {
            const validatedData = user_1.UserSignupSchema.parse(args);
            const existingUser = await dbConnect_1.prisma.user.findFirst({
                where: { email: validatedData.email, isVerified: true },
            });
            const sendOtpEmail = async (userName, email, otp) => {
                const emailSubject = "Confirm Your Email Address";
                const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
                await (0, emailService_1.sendEmail)(email, emailSubject, emailText);
            };
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
    },
};
const server = new server_1.ApolloServer({
    typeDefs,
    resolvers,
});
async function startServer() {
    await server.start();
    app.use((0, express_1.json)());
    app.use("/graphql", (0, express4_1.expressMiddleware)(server));
    const port = process.env.PORT || 4000;
    try {
        app.listen(port, () => {
            console.log(`App working at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error(`Server failed to start with the error:\n${error}`);
    }
}
startServer();
//# sourceMappingURL=server.js.map