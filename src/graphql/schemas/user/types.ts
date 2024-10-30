import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!
    userMe(token: String): User
  }

  type Mutation {
    userSignup(name: String!, email: String!, password: String!): User
    verifyUserEmail(email: String!, otp: String!): User
    userLogin(email: String!, password: String!): User
    forgetUserPassword(email: String!): User
    changeUserPassword(email: String!, password: String!, otp: String!): User
    updateUserDetails(
      name: String
      hideDetails: Boolean
      token: String
      avatar: Upload
      addressesToDelete: [String]
    ): User
  }
`;
