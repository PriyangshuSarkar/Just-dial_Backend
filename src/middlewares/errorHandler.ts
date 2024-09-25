import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  console.error(error);

  let status = error.status || 500;
  let message = error.message || "Internal Server Error";

  if (error instanceof ZodError) {
    message = "Un-processable Entity!";
  }

  return response.status(status).json({
    message,
    error: error,
  });
};
