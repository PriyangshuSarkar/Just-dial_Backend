import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!
    businessMe: Business
    businessLogin(email: String, phone: String, password: String!): Business
  }

  enum BusinessType {
    INDIVIDUAL
    FIRM
  }

  input BusinessAddressInput {
    order: Int
    addressId: ID
    street: String
    city: String
    state: String
    country: String
    pincode: String
    toDelete: Boolean
  }

  input BusinessWebsiteInput {
    websiteId: ID
    type: String
    url: String
    toDelete: Boolean
  }

  input BusinessCoverImageInput {
    imageId: ID
    image: Upload
    order: Int
    toDelete: Boolean
  }
  input BusinessAdBannerImageInput {
    imageId: ID
    image: Upload
    order: Int
    toDelete: Boolean
  }
  input BusinessMobileAdBannerImageInput {
    imageId: ID
    image: Upload
    order: Int
    toDelete: Boolean
  }

  input BusinessSupportingDocumentInput {
    documentId: ID
    document: Upload
    type: String
    toDelete: Boolean
  }

  type Mutation {
    businessSignup(
      email: String
      phone: String
      type: BusinessType!
    ): BusinessPrimaryContact
    verifyBusinessPrimaryContact(
      email: String
      phone: String
      otp: String!
      password: String
    ): BusinessPrimaryContact
    addBusinessPrimaryContact(
      email: String
      phone: String
    ): BusinessPrimaryContact
    forgetBusinessPassword(email: String, phone: String): BusinessPrimaryContact
    changeBusinessPassword(
      email: String
      phone: String
      password: String!
      otp: String!
    ): Business
    updateBusinessDetails(
      name: String
      slug: String
      type: BusinessType
      isListed: Boolean
      registrationNumber: String
      license: String
      experience: Int
      teamSize: Int
      description: String
      degrees: [String!]
      gstNumber: String
      categoryId: ID
      languages: [String!]
      proficiencies: [String!]
      courts: [String!]
      tags: [String!]
      latitude: Float
      longitude: Float
      additionalContacts: [String!]
      logo: Upload
    ): Business
    deleteBusinessAccount: Business
    manageBusinessAddress(
      addresses: [BusinessAddressInput!]!
    ): [BusinessAddress]
    manageBusinessWebsite(websites: [BusinessWebsiteInput!]!): [BusinessWebsite]
    manageBusinessCoverImage(
      images: [BusinessCoverImageInput!]!
    ): [BusinessCoverImage]
    manageBusinessAdBannerImage(
      images: [BusinessAdBannerImageInput!]!
    ): [BusinessAdBannerImage]
    manageBusinessMobileAdBannerImage(
      images: [BusinessMobileAdBannerImageInput!]!
    ): [BusinessMobileAdBannerImage]
    manageBusinessSupportingDocuments(
      image: [BusinessSupportingDocumentInput!]!
    ): [BusinessSupportingDocuments]
    businessSubscription(subscriptionId: ID!): Razorpay!
    businessVerifyPayment(
      razorpay_order_id: String!
      razorpay_payment_id: String!
      razorpay_signature: String!
    ): Business
  }
`;
