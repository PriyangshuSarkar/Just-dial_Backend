import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload
  # Enums
  enum AllUsersSortBy {
    NAME
    CREATED_AT
    UPDATED_AT
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum BusinessType {
    INDIVIDUAL
    FIRM
  }

  enum AllBusinessesSortBy {
    NAME
    CREATED_AT
    AVERAGE_RATING
    REVIEW_COUNT
  }

  # Query Type Definitions
  type Query {
    status: String!

    adminLogin(email: String!, password: String!): Admin

    allUsers(
      name: String
      email: String
      phone: String
      subscriptionId: String
      hasSubscription: Boolean
      isVerified: Boolean
      createdAtStart: String
      createdAtEnd: String
      page: Int = 1
      limit: Int = 10
      sortBy: AllUsersSortBy = CREATED_AT
      sortOrder: SortOrder = DESC
    ): [User]

    allBusinesses(
      name: String
      email: String
      phone: String
      type: BusinessType
      isBusinessVerified: Boolean
      subscriptionId: String
      hasSubscription: Boolean
      categoryId: String
      averageRatingMin: Float
      averageRatingMax: Float
      isListed: Boolean
      createdAtStart: String
      createdAtEnd: String
      page: Int = 1
      limit: Int = 10
      sortBy: AllBusinessesSortBy = CREATED_AT
      sortOrder: SortOrder = DESC
    ): [Business]
  }

  # Mutation Type Definitions
  type Mutation {
    blockUsers(userIds: [String!]!): [User]
    blockBusinesses(businessIds: [String!]!): [Business]
    verifyBusinesses(businessIds: [String!]!): [Business]
    manageUserSubscription(
      id: String
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      toDelete: Boolean
    ): UserSubscription
    manageBusinessSubscription(
      id: String
      name: String!
      description: String
      type: BusinessType!
      price: Float!
      duration: Int!
      features: [String!]!
      tierLevel: Int
      toDelete: Boolean
    ): BusinessSubscription
    manageLanguage(
      id: String
      name: String!
      slug: String
      toDelete: Boolean
    ): Language
    manageProficiency(
      id: String
      name: String!
      slug: String
      toDelete: Boolean
    ): Proficiency
    manageCourt(
      id: String
      name: String!
      slug: String
      toDelete: Boolean
    ): Court
    manageCategory(
      id: String
      name: String!
      slug: String
      categoryImage: Upload
      toDelete: Boolean
    ): Category
    manageTag(id: String, name: String!, toDelete: Boolean): Tag
    manageCountry(id: ID, name: String!, slug: String): Country
    manageState(id: ID, name: String!, slug: String, countryId: ID!): State
    manageCity(id: ID, name: String!, slug: String, stateId: ID!): City
    managePincode(id: ID, code: String!, slug: String, cityId: ID!): Pincode
  }
`;
