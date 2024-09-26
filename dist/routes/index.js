"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = __importDefault(require("./user"));
const business_1 = __importDefault(require("./business"));
const rootRouter = (0, express_1.Router)();
rootRouter.use("/user", user_1.default);
rootRouter.use("/business", business_1.default);
exports.default = rootRouter;
//# sourceMappingURL=index.js.map