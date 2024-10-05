import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID
    name: String
    email: String
    isVerified: Boolean
    phone: String
    address: Address
    message: String
    token: String
    avatar: String
  }

  type Address {
    street: String
    city: String
    state: String
    pincode: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    pincode: String
  }

  scalar Upload

  type Query {
    status: String!
  }

  type Mutation {
    userSignup(name: String!, email: String!, password: String!): User
    verifyUserEmail(email: String!, otp: String!): User
    userLogin(email: String!, password: String!): User
    forgetUserPassword(email: String!): User
    changeUserPassword(email: String!, password: String!, otp: String!): User
    updateUserDetails(
      name: String
      phone: String
      token: String
      address: AddressInput
      avatar: Upload
    ): User
  }
`;
