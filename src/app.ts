import express, { json, Express } from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { dbConnect } from "./utils/dbConnect";
import { errorHandler } from "./middlewares/errorHandler";
import rootRouter from "./routes";
import morgan from "morgan";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql";

config();
const app: Express = express();
const server = new ApolloServer({
  typeDefs: schema.typeDefs,
  resolvers: schema.resolvers,
});
app.use(cookieParser());
app.use(json());
app.use(morgan("dev"));

async function startServer() {
  await server.start();

  dbConnect();

  app.use("/api", rootRouter);
  app.use("/graphql", expressMiddleware(server));

  app.use(errorHandler);

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
