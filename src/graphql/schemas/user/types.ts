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
    hideDetails: Boolean
  }

  type Address {
    id: ID
    street: Street
    city: City
    state: State
    country: Country
    pincode: Pincode
  }

  type Street {
    id: ID
    name: String
  }

  type City {
    id: ID
    name: String
  }

  type State {
    id: ID
    name: String
  }

  type Country {
    id: ID
    name: String
  }

  type Pincode {
    id: ID
    code: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    pincode: String
    country: String
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
      hideDetails: Boolean
      token: String
      address: AddressInput
      avatar: Upload
    ): User
  }
`;
