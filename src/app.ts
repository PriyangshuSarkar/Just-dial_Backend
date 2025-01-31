import express, { json, Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import { graphqlUploadExpress } from "graphql-upload-ts";
import { auth } from "./middlewares/auth";
import morgan from "morgan";
import cors from "cors";
import os from "os";

async function startServer() {
  try {
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

    app.get("/", (_: unknown, res: Response) => {
      res.send("Server is working!");
    });

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

    app.listen(port, () => {
      const networkInterfaces = os.networkInterfaces();
      const addresses: string[] = [];

      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName]?.forEach((interfaceInfo: any) => {
          if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
            addresses.push(interfaceInfo.address);
          }
        });
      });

      console.log("🚀 Server running at:");
      addresses.forEach((address) => {
        console.log(`http://${address}:${port}`);
      });
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
