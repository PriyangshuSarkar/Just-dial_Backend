import { gql } from "graphql-tag";

export const typeDefs = gql`
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
    verifyBusinesses(businessIds: [String!]!): [Business]
    blockBusinesses(businessIds: [String!]!): [Business]
    blockUsers(userIds: [String!]!): [User]
  }
`;
