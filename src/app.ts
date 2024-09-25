import express, { json, Express } from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { dbConnect } from "./utils/dbConnect";
import { errorHandler } from "./middlewares/errorHandler";
import rootRouter from "./routes";

config();

const app: Express = express();

app.use(cookieParser());
app.use(json());

dbConnect();

app.use("/api", rootRouter);

app.use(errorHandler);

// *Server Start
const port = process.env.PORT;

try {
  app.listen(port, () => {
    console.log(`App working at http://localhost:${process.env.PORT}`);
  });
} catch (error) {
  console.error(`Server failed to start with the error:\n${error}`);
}
