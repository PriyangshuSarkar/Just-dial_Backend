import { gql } from "graphql-tag";

export const typeDefs = gql`
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
