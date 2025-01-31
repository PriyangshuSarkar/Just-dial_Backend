import express, { json, Express, Request } from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import { graphqlUploadExpress } from "graphql-upload-ts";
import { auth } from "./middlewares/auth";
import morgan from "morgan";
import cors from "cors";

async function startServer() {
  const app: Express = express();
  app.use(morgan(process.env.LOG_LEVEL || "combined"));
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(json());
  app.use(
    graphqlUploadExpress({
      maxFileSize:
        parseInt(process.env.MAX_FILE_SIZE_MB || "100") * 1024 * 1024,
      maxFiles: parseInt(process.env.MAX_FILES_UPLOAD || "10"),
    })
  );
  app.use(auth);
  const server = new ApolloServer({
    typeDefs: schema.typeDefs,
    resolvers: schema.resolvers,
    csrfPrevention: process.env.ENABLE_CSRF_PREVENTION === "true",
    introspection: process.env.GRAPHQL_INTROSPECTION === "true",
  });
  await server.start();

  dbConnect();

  // app.use("/api");

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const owner = (req as Request).owner;
        // console.log(owner);
        return {
          owner,
        };
      },
    })
  );

  // *Server Start
  const port = process.env.PORT;

  try {
    const serverInstance = app.listen(port, () => {
      const address = serverInstance.address();
      const actualHost =
        typeof address === "string"
          ? address
          : address?.address === "::"
          ? "localhost" // Replace IPv6 shorthand with localhost
          : address?.address;

      const actualPort = typeof address === "string" ? port : address?.port;

      // Determine protocol dynamically
      const protocol = process.env.PROTOCOL === "production" ? "https" : "http";

      console.log(
        `🚀 Server ready at ${protocol}://${actualHost}:${actualPort}`
      );
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
