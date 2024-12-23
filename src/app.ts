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
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ limit: "100mb", extended: true }));
  app.use(graphqlUploadExpress({ maxFileSize: 10 * 1024 * 1024, maxFiles: 1 }));
  app.use(auth);
  const server = new ApolloServer({
    typeDefs: schema.typeDefs,
    resolvers: schema.resolvers,
    csrfPrevention: false,
    introspection: true,
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
