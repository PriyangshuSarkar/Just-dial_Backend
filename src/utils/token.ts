import { verify, sign, Secret, SignOptions } from "jsonwebtoken";

export const verifyToken = (token: string) => {
  try {
    return verify(token, process.env.JWT_SECRET!); // Use your secret here
  } catch (error: unknown) {
    console.log(error);
    return undefined;
  }
};

export const generateToken = (
  payload: string,
  type: "USER" | "BUSINESS" | "ADMIN"
): string => {
  // Ensure environment variables are properly set
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRATION_TIME) {
    throw new Error("JWT configuration is missing in environment variables.");
  }

  // Type assertions for environment variables
  const jwtSecret: Secret = process.env.JWT_SECRET;
  const jwtExpirationTime: string | number = process.env.JWT_EXPIRATION_TIME;

  // JWT options
  const options: SignOptions = {
    expiresIn: jwtExpirationTime as any, // `expiresIn` is of type `string | number`
  };

  // Token payload
  const tokenPayload: object = {
    [`${type.toLowerCase()}Id`]: payload,
  };

  // Generate and return the JWT
  return sign(tokenPayload, jwtSecret, options);
};
