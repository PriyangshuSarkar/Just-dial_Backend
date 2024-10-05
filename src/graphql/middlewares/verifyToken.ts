import { verify } from "jsonwebtoken";

export const verifyToken = (token: string) => {
  try {
    return verify(token, process.env.JWT_SECRET!); // Use your secret here
  } catch (error: any) {
    throw new Error("Invalid or expired token", error);
  }
};
