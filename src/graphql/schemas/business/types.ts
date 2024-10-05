import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Business {
    id: ID
    website: String
    rating: Float
    isVerified: Boolean
    email: String
    name: String
    phone: String
    type: String
    address: Address
    companyLogo: String
    companyImages: [String]
    message: String
    token: String
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

  type Query {
    status: String!
  }

  scalar Update

  type Mutation {
    businessSignup(name: String!, email: String!, password: String!): Business
    verifyBusinessEmail(email: String!, otp: String!): Business
    businessLogin(email: String!, password: String!): Business
    forgetBusinessPassword(email: String!): Business
    changeBusinessPassword(
      email: String!
      password: String!
      otp: String!
    ): Business
    updateBusinessDetails(
      name: String
      website: String
      phone: String
      type: String
      address: AddressInput
      companyLogo: Upload
      companyImages: [Upload]
    ): Business
  }
`;
