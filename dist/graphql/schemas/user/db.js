"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSignupSchema = void 0;
const zod_1 = require("zod");
exports.UserSignupSchema = (0, zod_1.object)({
    name: (0, zod_1.string)().min(2).max(50),
    email: (0, zod_1.string)().email(),
    password: (0, zod_1.string)().min(8).max(100),
});
//# sourceMappingURL=db.js.map