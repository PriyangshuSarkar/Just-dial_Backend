import type { Request, Response, NextFunction } from "express";

export type controllerType = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export const tryCatch = (func: controllerType) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      await Promise.resolve(func(request, response, next));
    } catch (error) {
      next(error); // Pass the error to the next middleware
    }
  };
};
