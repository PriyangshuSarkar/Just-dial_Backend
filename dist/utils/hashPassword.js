"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const crypto_1 = require("crypto");
const hashPassword = (password) => {
    try {
        const salt = (0, crypto_1.randomBytes)(16).toString("hex");
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, 1000, 64, "sha512").toString("hex");
        return { salt, hash };
    }
    catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Could not hash password");
    }
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, salt, hash) => {
    try {
        const hashedPassword = (0, crypto_1.pbkdf2Sync)(password, salt, 1000, 64, "sha512").toString("hex");
        return hashedPassword === hash;
    }
    catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Could not hash password");
    }
};
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=hashPassword.js.map