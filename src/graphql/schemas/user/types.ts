import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!
    userMe: User
    userLogin(email: String, phone: String, password: String!): User
  }

  input UserAddressInput {
    addressId: String
    street: String
    city: String
    state: String
    country: String
    pincode: String
    toDelete: Boolean
  }

  type Mutation {
    userGoogleOAuth(googleOAuthToke: String!): User
    userSignup(
      name: String!
      email: String
      phone: String
      password: String!
    ): UserContact
    addUserContact(email: String, phone: String): UserContact
    verifyUserContact(email: String, phone: String, otp: String!): User
    forgetUserPassword(email: String, phone: String): UserContact
    changeUserPassword(
      email: String
      phone: String
      password: String!
      otp: String!
    ): User
    updateUserDetails(
      name: String
      slug: String
      hideDetails: Boolean
      avatar: Upload
    ): User
    deleteUserAccount: User
    manageUserAddress(addresses: [UserAddressInput!]!): UserAddress
  }
`;
