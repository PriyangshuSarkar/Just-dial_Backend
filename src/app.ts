import express, { json, Express } from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { dbConnect } from "./utils/dbConnect";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";

config();
const app: Express = express();
const server = new ApolloServer({
  typeDefs: schema.typeDefs,
  resolvers: schema.resolvers,
  csrfPrevention: false,
});
app.use(cookieParser());
app.use(json());
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

async function startServer() {
  await server.start();

  dbConnect();

  // app.use("/api");

  app.use("/graphql", expressMiddleware(server));

  // *Server Start
  const port = process.env.PORT;

  try {
    app.listen(port, () => {
      console.log(`App working at http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Server failed to start with the error:\n${error}`);
  }
}

startServer();
