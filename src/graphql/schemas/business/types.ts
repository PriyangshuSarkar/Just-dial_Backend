import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Update

  type Query {
    status: String!
    businessMe(token: String): Business
  }

  type Mutation {
    businessSignup(
      name: String!
      email: String!
      password: String!
      type: String!
    ): Business
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
      type: String
      companyLogo: Upload
      companyImages: [Upload]
      companyImagesToDelete: [String]
    ): Business
    addService(
      token: String!
      name: String!
      overview: String!
      price: Float!
      discountedPrice: Float
      serviceImages: [Upload]
      tags: [String]
      facilities: [String]
      subcategoryId: ID!
    ): Service
    updateService(
      token: String!
      serviceId: ID!
      name: String
      overview: String
      price: Float
      discountedPrice: Float
      tags: [String]
      facilities: [String]
      tagsToDelete: [String]
      facilitiesToDelete: [String]
      serviceImages: [Upload]
      serviceImagesToDelete: [String]
    ): Service
    removeService(token: String!, serviceId: ID!): Service
  }
`;
