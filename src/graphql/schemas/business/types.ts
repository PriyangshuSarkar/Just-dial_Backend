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
    address: [Address]
    companyLogo: String
    companyImages: [String]
    message: String
    token: String
    service: Service
  }

  type Service {
    id: ID
    name: String
    message: String
    overview: String
    price: Float
    discountedPrice: Float
    serviceImages: [String]
    tags: [Tag]
    facilities: [Facility]
    address: [Address]
    subcategory: Subcategory
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

  type Tag {
    id: ID
    name: String
  }

  type Facility {
    id: ID
    name: String
  }

  type Subcategory {
    id: ID
    name: String
    category: Category
  }

  type Category {
    id: ID
    name: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    pincode: String
    country: String
  }

  scalar Update

  type Query {
    status: String!
  }

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
      addressesToDelete: [String]
      companyImagesToDelete: [String]
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
      addressesToDelete: [String]
      serviceImagesToDelete: [String]
      tagsToDelete: [String]
      facilitiesToDelete: [String]
    ): Service
  }
`;
