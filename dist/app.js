"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = require("dotenv");
const dbConnect_1 = require("./utils/dbConnect");
const errorHandler_1 = require("./middlewares/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const morgan_1 = __importDefault(require("morgan"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const graphql_1 = require("./graphql");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const server = new server_1.ApolloServer({
    typeDefs: graphql_1.schema.typeDefs,
    resolvers: graphql_1.schema.resolvers,
});
app.use((0, cookie_parser_1.default)());
app.use((0, express_1.json)());
app.use((0, morgan_1.default)("dev"));
async function startServer() {
    await server.start();
    (0, dbConnect_1.dbConnect)();
    app.use("/api", routes_1.default);
    app.use("/graphql", (0, express4_1.expressMiddleware)(server));
    app.use(errorHandler_1.errorHandler);
    const port = process.env.PORT;
    try {
        app.listen(port, () => {
            console.log(`App working at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error(`Server failed to start with the error:\n${error}`);
    }
}
startServer();
//# sourceMappingURL=app.js.map