"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
const dbConnect = async () => {
    try {
        await exports.prisma.$connect();
        console.log("Database Connected.");
    }
    catch (error) {
        console.error("Database connection error:", error);
        throw error;
    }
};
exports.dbConnect = dbConnect;
//# sourceMappingURL=dbConnect.js.map