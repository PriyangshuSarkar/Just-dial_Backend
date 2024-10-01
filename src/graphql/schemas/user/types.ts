import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID
    name: String
    email: String
    message: String
    token: String
  }

  type Image {
    url: String!
    publicId: String!
  }

  scalar Upload

  type Query {
    status: String!
  }

  type Mutation {
    userSignup(name: String!, email: String!, password: String!): User!
    verifyUserEmail(email: String!, otp: String!): User!
    userLogin(email: String!, password: String!): User!
    forgetUserPassword(email: String!): User!
    changeUserPassword(email: String!, password: String!, otp: String!): User!
    uploadImage(file: Upload!): Image!
  }
`;
