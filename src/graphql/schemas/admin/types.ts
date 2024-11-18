import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Query {
    status: String!
    adminLogin(email: String!, password: String!): Admin
  }

  # type Mutation {
  # }
`;
