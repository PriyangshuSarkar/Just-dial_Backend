"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLoginSchema = void 0;
const zod_1 = require("zod");
exports.AdminLoginSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
});
//# sourceMappingURL=db.js.map