import { gql } from "graphql-tag";

export const typeDefs = gql`
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

// console.log(typeDefs);
