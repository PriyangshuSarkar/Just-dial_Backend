"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_1 = require("../controllers/business");
const businessRoutes = (0, express_1.Router)();
businessRoutes.post("/signup", business_1.businessSignup);
businessRoutes.post("/verify", business_1.verifyBusinessEmail);
businessRoutes.post("/login", business_1.businessLogin);
businessRoutes.post("/password/forget", business_1.forgetBusinessPassword);
businessRoutes.post("/password/change", business_1.changeBusinessPassword);
exports.default = businessRoutes;
//# sourceMappingURL=business.js.map