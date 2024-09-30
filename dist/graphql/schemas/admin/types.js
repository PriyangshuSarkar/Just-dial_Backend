"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.typeDefs = (0, graphql_tag_1.gql) `
  type Admin {
    id: ID
    name: String
    email: String
    message: String
    token: String
  }

  type Query {
    status: String!
  }

  type Mutation {
    adminSignup(name: String!, email: String!, password: String!): Admin!
    verifyAdminEmail(email: String!, otp: String!): Admin!
    adminLogin(email: String!, password: String!): Admin!
    forgetAdminPassword(email: String!): Admin!
    changeAdminPassword(email: String!, password: String!, otp: String!): Admin!
  }
`;
//# sourceMappingURL=types.js.map