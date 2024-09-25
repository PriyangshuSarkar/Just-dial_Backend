import { pbkdf2Sync, randomBytes } from "crypto";

export const hashPassword = (password: string) => {
  try {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
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
      1000,
      64,
      "sha512"
    ).toString("hex");
    return hashedPassword === hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Could not hash password");
  }
};
