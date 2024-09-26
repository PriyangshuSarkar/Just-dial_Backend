"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeAdminPasswordSchema = exports.ForgetAdminPasswordSchema = exports.AdminLoginSchema = exports.VerifyAdminEmailSchema = exports.AdminSignupSchema = void 0;
const zod_1 = require("zod");
exports.AdminSignupSchema = (0, zod_1.object)({
    name: (0, zod_1.string)(),
    email: (0, zod_1.string)().email(),
    password: (0, zod_1.string)(),
});
exports.VerifyAdminEmailSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
exports.AdminLoginSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
});
exports.ForgetAdminPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
});
exports.ChangeAdminPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
//# sourceMappingURL=admin.js.map