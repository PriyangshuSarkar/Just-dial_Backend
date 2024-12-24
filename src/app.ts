import express, { json, Express, Request, urlencoded } from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import { graphqlUploadExpress } from "graphql-upload-ts";
import { auth } from "./middlewares/auth";
import morgan from "morgan";

async function startServer() {
  const app: Express = express();
  app.use(morgan(process.env.LOG_LEVEL || "dev"));
  app.use(cookieParser());
  app.use(json());
  app.use(urlencoded());
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
    app.listen(port, () => {
      console.log(`🚀 Server ready at http://127.0.0.1:${port}/graphql`);
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
