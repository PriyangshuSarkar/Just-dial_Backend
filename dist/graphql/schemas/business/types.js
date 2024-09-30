"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.typeDefs = (0, graphql_tag_1.gql) `
  type Business {
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
    businessSignup(name: String!, email: String!, password: String!): Business!
    verifyBusinessEmail(email: String!, otp: String!): Business!
    businessLogin(email: String!, password: String!): Business!
    forgetBusinessPassword(email: String!): Business!
    changeBusinessPassword(
      email: String!
      password: String!
      otp: String!
    ): Business!
  }
`;
//# sourceMappingURL=types.js.map