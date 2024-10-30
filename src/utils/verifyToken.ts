import { verify, sign } from "jsonwebtoken";

export const verifyToken = (token: string) => {
  try {
    return verify(token, process.env.JWT_SECRET!); // Use your secret here
  } catch (error: any) {
    throw new Error("Invalid or expired token", error);
  }
};

export const generateToken = (
  payload: string,
  type: "USER" | "BUSINESS" | "ADMIN"
) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRATION_TIME) {
    throw new Error("JWT configuration is missing in environment variables.");
  }

  const tokenPayload = {
    [`${type.toLowerCase()}Id`]: payload,
  };

  return sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION_TIME,
  });
};
