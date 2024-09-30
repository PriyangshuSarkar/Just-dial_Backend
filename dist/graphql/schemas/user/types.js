"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.typeDefs = (0, graphql_tag_1.gql) `
  type User {
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
    userSignup(name: String!, email: String!, password: String!): User!
    verifyUserEmail(email: String!, otp: String!): User!
    userLogin(email: String!, password: String!): User!
    forgetUserPassword(email: String!): User!
    changeUserPassword(email: String!, password: String!, otp: String!): User!
  }
`;
//# sourceMappingURL=types.js.map