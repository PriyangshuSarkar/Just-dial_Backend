"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const userRoutes = (0, express_1.Router)();
userRoutes.post("/signup", user_1.userSignup);
userRoutes.post("/verify", user_1.verifyUserEmail);
userRoutes.post("/login", user_1.userLogin);
userRoutes.post("/password/forget", user_1.forgetUserPassword);
userRoutes.post("/password/change", user_1.changeUserPassword);
exports.default = userRoutes;
//# sourceMappingURL=user.js.map