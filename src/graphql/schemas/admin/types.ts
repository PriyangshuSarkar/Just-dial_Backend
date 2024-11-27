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
      subscriptionId: ID
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
      subscriptionId: ID
      hasSubscription: Boolean
      categoryId: ID
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
    blockUsers(userIds: [ID!]!): [User]
    blockBusinesses(businessIds: [ID!]!): [Business]
    verifyBusinesses(businessIds: [ID!]!): [Business]
    manageUserSubscription(
      id: ID
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      toDelete: Boolean
    ): UserSubscription
    manageBusinessSubscription(
      id: ID
      name: String!
      description: String
      type: BusinessType!
      price: Float!
      duration: Int!
      features: [String!]!
      tierLevel: Int
      toDelete: Boolean
    ): BusinessSubscription
    manageLanguage(languages: [ManageLanguageInput!]!): [Language]
    manageProficiency(proficiencies: [ManageProficiencyInput!]!): [Proficiency]
    manageCourt(courts: [ManageCourtInput!]!): [Court]
    manageCategory(categories: [ManageCategoryInput!]!): [Category]
    manageTag(tags: [ManageTagInput!]!): [Tag]
    manageCountry(countries: [ManageCountryInput!]!): [Country]
    manageState(states: [ManageStateInput!]!): [State]
    manageCity(cities: [ManageCityInput!]!): [City]
    managePincode(pincodes: [ManagePincodeInput!]!): [Pincode]
  }

  input ManageLanguageInput {
    id: ID
    name: String!
    slug: String
    toDelete: Boolean
  }

  input ManageProficiencyInput {
    id: ID
    name: String!
    slug: String
    toDelete: Boolean
  }

  input ManageCourtInput {
    id: ID
    name: String!
    slug: String
    toDelete: Boolean
  }

  input ManageCategoryInput {
    id: ID
    name: String!
    slug: String
    categoryImage: Upload
    toDelete: Boolean
  }

  input ManageTagInput {
    id: ID
    name: String!
    toDelete: Boolean
  }

  input ManageCountryInput {
    id: ID
    name: String!
    slug: String
  }

  input ManageStateInput {
    id: ID
    name: String!
    slug: String
    countryId: ID!
  }

  input ManageCityInput {
    id: ID
    name: String!
    slug: String
    stateId: ID!
  }

  input ManagePincodeInput {
    id: ID
    code: String!
    slug: String
    cityId: ID!
  }
`;
