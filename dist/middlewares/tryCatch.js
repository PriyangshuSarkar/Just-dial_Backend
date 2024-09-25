"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = void 0;
const tryCatch = (func) => {
    return async (request, response, next) => {
        try {
            await Promise.resolve(func(request, response, next));
        }
        catch (error) {
            next(error);
        }
    };
};
exports.tryCatch = tryCatch;
//# sourceMappingURL=tryCatch.js.map