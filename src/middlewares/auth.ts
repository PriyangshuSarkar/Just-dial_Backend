import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/verifyToken";
import { googleOAuth } from "../utils/googleOAuth";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return next();
    }

    let token: string;
    let authType: string;

    // Check if authorization header starts with known prefixes
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7); // Remove "Bearer " prefix
      authType = "jwt";
    } else if (authHeader.startsWith("Google ")) {
      token = authHeader.slice(7); // Remove "Google " prefix
      authType = "google";
    } else {
      return next(); // Unsupported authentication method, skip
    }

    if (!token) {
      return next();
    }

    let ownerData;

    if (authType === "jwt") {
      // Verify JWT token
      ownerData = await verifyToken(token); // This should return decoded JWT payload
    } else if (authType === "google") {
      // Verify Google OAuth token
      const ticket = await googleOAuth.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // Match your Google client ID
      });
      const payload = ticket.getPayload();

      ownerData = payload; // This contains Google user info
    }

    req.owner = ownerData;
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return next();
  }
};
