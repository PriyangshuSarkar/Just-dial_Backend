// import { verifyToken } from "../../middlewares/verifyToken";

// export const context = async ({ req }) => {
//   const authHeader = req.headers.authorization || "";
//   const token = authHeader.replace("Bearer ", "");

//   let owner = null; // Default to null for unauthenticated requests

//   if (token) {
//     try {
//       owner = verifyToken(token); // Verify the token and get user info
//     } catch (error) {
//       // Log the error if needed
//       console.error("Invalid token", error);
//     }
//   }

//   return { owner }; // Attach user to context (can be null)
// };
