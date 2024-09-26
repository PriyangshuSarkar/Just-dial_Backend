"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeBusinessPasswordSchema = exports.ForgetBusinessPasswordSchema = exports.BusinessLoginSchema = exports.VerifyBusinessEmailSchema = exports.BusinessSignupSchema = void 0;
const zod_1 = require("zod");
exports.BusinessSignupSchema = (0, zod_1.object)({
    name: (0, zod_1.string)(),
    email: (0, zod_1.string)().email(),
    password: (0, zod_1.string)(),
});
exports.VerifyBusinessEmailSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
exports.BusinessLoginSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
});
exports.ForgetBusinessPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
});
exports.ChangeBusinessPasswordSchema = (0, zod_1.object)({
    email: (0, zod_1.string)(),
    password: (0, zod_1.string)(),
    otp: (0, zod_1.string)(),
});
//# sourceMappingURL=business.js.map