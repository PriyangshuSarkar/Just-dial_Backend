"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeUserPasswordSchema = exports.ForgetUserPasswordSchema = exports.UserLoginSchema = exports.VerifyUserEmailSchema = exports.UserSignupSchema = void 0;
const zod_1 = require("zod");
exports.UserSignupSchema = (0, zod_1.object)({
    name: (0, zod_1.string)(),
    email: (0, zod_1.string)().email(),
    phone: (0, zod_1.string)().optional(),
    password: (0, zod_1.string)(),
});
exports.VerifyUserEmailSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
exports.UserLoginSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
});
exports.ForgetUserPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
});
exports.ChangeUserPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
//# sourceMappingURL=user.js.map