"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const user_1 = require("./schemas/user");
exports.schema = {
    typeDefs: [user_1.userSchema.typeDefs],
    resolvers: [user_1.userSchema.resolvers],
};
//# sourceMappingURL=index.js.map