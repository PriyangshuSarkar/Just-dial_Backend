import express, { json, Express } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { config } from "dotenv";
import { prisma } from "./utils/dbConnect";
import { randomBytes } from "crypto"; // Assuming you're using this for OTP generation
import { hashPassword } from "./utils/password"; // Ensure you have this utility for hashing
import { sendEmail } from "./utils/emailService"; // Ensure you have this utility for sending emails
import { UserSignupSchema } from "./schemas/user"; // Ensure you have this schema for validation

// Load environment variables
config();

const app: Express = express();

// Updated type definitions
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
    signup: async (
      _: unknown,
      args: { name: string; email: string; password: string }
    ) => {
      // Validate input
      const validatedData = UserSignupSchema.parse(args);

      const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email, isVerified: true },
      });

      // Send OTP email helper function
      const sendOtpEmail = async (
        userName: string,
        email: string,
        otp: string
      ) => {
        const emailSubject = "Confirm Your Email Address";
        const emailText = `Hello ${userName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;

        await sendEmail(email, emailSubject, emailText);
      };

      if (existingUser) {
        throw new Error("User already exists and email is verified!");
      }

      const otp = randomBytes(3).toString("hex").substring(0, 6);
      const { salt, hash } = hashPassword(validatedData.password); // Hash the password

      // Upsert user in the database
      const newUser = await prisma.user.upsert({
        where: { email: validatedData.email },
        update: {
          name: validatedData.name,
          password: hash,
          salt,
          deletedAt: null,
          otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
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

      await sendOtpEmail(newUser.name, newUser.email, otp); // Send OTP email

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        message: "User created! Please verify your email.",
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  await server.start();

  app.use(json());
  app.use("/graphql", expressMiddleware(server));

  const port = process.env.PORT || 4000; // Fallback port if env var is undefined

  try {
    app.listen(port, () => {
      console.log(`App working at http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
