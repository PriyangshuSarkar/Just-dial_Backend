import { pbkdf2Sync, randomBytes } from "crypto";

const HASH_ITERATIONS = parseInt(process.env.HASH_ITERATIONS || "100000", 10);
const HASH_LENGTH = parseInt(process.env.HASH_LENGTH || "64", 10);
const HASH_ALGORITHM = process.env.HASH_ALGORITHM || "sha512";

export const hashPassword = (password: string) => {
  try {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(
      password,
      salt,
      HASH_ITERATIONS,
      HASH_LENGTH,
      HASH_ALGORITHM
    ).toString("hex");
    return { salt, hash };
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Could not hash password");
  }
};

export const verifyPassword = (
  password: string,
  salt: string,
  hash: string
) => {
  try {
    const hashedPassword = pbkdf2Sync(
      password,
      salt,
      HASH_ITERATIONS,
      HASH_LENGTH,
      HASH_ALGORITHM
    ).toString("hex");
    return hashedPassword === hash;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw new Error("Could not verify password");
  }
};
