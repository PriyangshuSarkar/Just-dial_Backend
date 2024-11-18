// src/types/express.d.ts

declare namespace Express {
  export interface Request {
    owner?: any; // Or define a more specific type for user if needed
  }
}
