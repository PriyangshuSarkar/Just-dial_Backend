"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadSchema = exports.ChangeUserPasswordSchema = exports.ForgetUserPasswordSchema = exports.UserLoginSchema = exports.VerifyUserEmailSchema = exports.UserSignupSchema = void 0;
const stream_1 = require("stream");
const zod_1 = require("zod");
exports.UserSignupSchema = (0, zod_1.object)({
    name: (0, zod_1.string)().min(2).max(50),
    email: (0, zod_1.string)().email(),
    password: (0, zod_1.string)().min(6).max(100),
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
exports.FileUploadSchema = (0, zod_1.object)({
    filename: (0, zod_1.string)(),
    mimetype: (0, zod_1.string)(),
    encoding: (0, zod_1.string)(),
    createReadStream: (0, zod_1.function)().returns((0, zod_1.instanceof)(stream_1.Readable)),
});
//# sourceMappingURL=db.js.map