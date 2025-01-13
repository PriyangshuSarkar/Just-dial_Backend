import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!
    userMe: User
    userLogin(email: String, phone: String, password: String!): User
    getUserAdminNotices: [AdminNotice]
    userGoogleOAuth(redirectURI: String!): UserGoogleOAuthResponse
    userGoogleOAuthVerify(code: String!): User
  }

  input UserAddressInput {
    addressId: ID
    street: String
    city: String
    state: String
    country: String
    pincode: String
    toDelete: Boolean
  }

  type UserGoogleOAuthResponse {
    requestId: String
    link: String
  }

  type Mutation {
    userSignup(
      name: String!
      email: String
      phone: String
      password: String!
    ): UserContact
    resendUserOtp(email: String, phone: String): UserContact
    addUserContact(email: String, phone: String): UserContact
    verifyUserContact(
      email: String
      phone: String
      requestId: String!
      otp: String!
    ): UserContact
    forgetUserPassword(email: String, phone: String): UserContact
    changeUserPassword(
      email: String
      phone: String
      password: String!
      otp: String!
      requestId: String!
    ): User
    updateUserDetails(
      name: String
      slug: ID
      hideDetails: Boolean
      avatar: Upload
    ): User
    deleteUserAccount: User
    manageUserAddress(addresses: [UserAddressInput!]!): [UserAddress]
    userSubscription(subscriptionId: ID!): Razorpay!
    userVerifyPayment(
      razorpay_order_id: String!
      razorpay_payment_id: String!
      razorpay_signature: String!
    ): User
  }
`;
