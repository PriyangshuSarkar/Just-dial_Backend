import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/verifyToken";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return next();
    }

    // Check if authorization header starts with "Bearer "
    if (!authHeader) {
      return next();
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader;

    if (!token) {
      return next();
    }

    // Verify the token and attach the owner data to the request
    const data = verifyToken(token);

    req.owner = data;
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return next();
  }
};
