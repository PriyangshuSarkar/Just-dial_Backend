"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.typeDefs = (0, graphql_tag_1.gql) `
  type User {
    id: ID!
    name: String!
    email: String!
    message: String!
  }

  type Query {
    status: String!
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): User!
  }
`;
//# sourceMappingURL=types.js.map