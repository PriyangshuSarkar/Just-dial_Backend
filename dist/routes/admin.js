"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../controllers/admin");
const adminRoutes = (0, express_1.Router)();
adminRoutes.post("/signup", admin_1.adminSignup);
adminRoutes.post("/verify", admin_1.verifyAdminEmail);
adminRoutes.post("/login", admin_1.adminLogin);
adminRoutes.post("/password/forget", admin_1.forgetAdminPassword);
adminRoutes.post("/password/change", admin_1.changeAdminPassword);
exports.default = adminRoutes;
//# sourceMappingURL=admin.js.map