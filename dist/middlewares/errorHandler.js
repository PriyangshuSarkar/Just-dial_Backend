"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (error, request, response, next) => {
    console.error(error);
    let status = error.status || 500;
    let message = error.message || "Internal Server Error";
    if (error instanceof zod_1.ZodError) {
        message = "Un-processable Entity!";
    }
    return response.status(status).json({
        message,
        error: error,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map