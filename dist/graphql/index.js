"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const admin_1 = require("./schemas/admin");
const business_1 = require("./schemas/business");
const user_1 = require("./schemas/user");
exports.schema = {
    typeDefs: [
        user_1.userSchema.typeDefs,
        business_1.businessSchema.typeDefs,
        admin_1.adminSchema.typeDefs,
    ],
    resolvers: [
        user_1.userSchema.resolvers,
        business_1.businessSchema.resolvers,
        admin_1.adminSchema.resolvers,
    ],
};
//# sourceMappingURL=index.js.map