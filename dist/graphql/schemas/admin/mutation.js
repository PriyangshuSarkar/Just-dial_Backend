"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = void 0;
const db_1 = require("./db");
const dbConnect_1 = require("../../../utils/dbConnect");
const jsonwebtoken_1 = require("jsonwebtoken");
exports.Mutation = {
    adminLogin: async (_, args) => {
        const validatedData = db_1.AdminLoginSchema.parse(args);
        const admin = await dbConnect_1.prisma.admin.findFirst({
            where: { email: validatedData.email },
        });
        if (!admin) {
            throw new Error("Email doesn't exit!");
        }
        if (admin.password === validatedData.password) {
            const token = (0, jsonwebtoken_1.sign)({ adminId: admin.id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            });
            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                message: "Logged in successful.",
                token: token,
            };
        }
        else {
            throw new Error("Wrong password!");
        }
    },
};
//# sourceMappingURL=mutation.js.map