import express, { json, Express, Request } from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import { auth } from "./middlewares/auth";

async function startServer() {
  const app: Express = express();
  app.use(cookieParser());
  app.use(json());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
  app.use(auth);
  const server = new ApolloServer({
    typeDefs: schema.typeDefs,
    resolvers: schema.resolvers,
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
      console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
