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
    service: Service
  }

  type Address {
    street: String
    city: String
    state: String
    pincode: String
    country: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    pincode: String
    country: String
  }

  type Query {
    status: String!
  }

  type Service {
    id: ID
    name: String
    message: String
    overview: String
    price: Float
    discountedPrice: Float
    serviceImages: [String]
    tags: [String]
    facilities: [String]
    address: Address
    subcategory: String
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
      token: String!
      name: String
      website: String
      phone: String
      type: String
      address: AddressInput
      companyLogo: Upload
      companyImages: [Upload]
    ): Business
    addOrUpdateService(
      token: ID!
      serviceId: ID
      name: String
      overview: String
      price: Float
      discountedPrice: Float
      serviceImages: [Upload]
      address: AddressInput
      tags: [String]
      facilities: [String]
    ): Business
  }
`;
