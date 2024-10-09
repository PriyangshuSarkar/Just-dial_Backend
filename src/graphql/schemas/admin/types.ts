import { gql } from "graphql-tag";

export const typeDefs = gql`
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
