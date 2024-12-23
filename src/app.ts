import express, { json, Express, urlencoded, Request } from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import { graphqlUploadExpress } from "graphql-upload-ts";
import { auth } from "./middlewares/auth";
import morgan from "morgan";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app: Express = express();

  // Middleware setup
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ limit: "100mb", extended: true }));
  app.use(graphqlUploadExpress({ maxFileSize: 10 * 1024 * 1024, maxFiles: 1 })); // 10MB max file size
  app.use(auth);

  // Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs: schema.typeDefs,
    resolvers: schema.resolvers,
    csrfPrevention: false, // Disable CSRF prevention if not needed
    introspection: process.env.NODE_ENV !== "production", // Introspection only in non-production
  });

  await server.start();

  // Connect to the database
  dbConnect();

  // GraphQL endpoint with context
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Extract owner or other context from the request
        const owner = (req as Request).owner;
        return { owner };
      },
    })
  );

  // Start the server
  const port = process.env.PORT || 4000; // Default to port 4000 if not set
  app.listen(port, () => {
    console.log(`🚀 Server ready at http://127.0.0.1:${port}/graphql`);
  });
}

startServer().catch((error) => {
  console.error(`❌ Failed to start server: ${error.message}`);
});
