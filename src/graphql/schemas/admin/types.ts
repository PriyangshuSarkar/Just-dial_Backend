import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload
  # Enums
  enum AllUsersSortBy {
    name
    createdAt
    updatedAt
  }

  enum SortOrder {
    asc
    desc
  }

  enum BusinessType {
    INDIVIDUAL
    FIRM
  }

  enum AllBusinessesSortBy {
    name
    createdAt
    averageRating
    reviewCount
  }

  type AllUserResult {
    users: [User]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }
  type AllBusinessResult {
    businesses: [Business]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }
  type AllReviewResult {
    reviews: [Review]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
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
      sortBy: AllUsersSortBy = createdAt
      sortOrder: SortOrder = desc
    ): AllUserResult

    allBusinesses(
      name: String
      email: String
      phone: String
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
      sortBy: AllBusinessesSortBy = createdAt
      sortOrder: SortOrder = desc
    ): AllBusinessResult

    searchAllReviews(
      search: String
      page: Int = 1
      limit: Int = 10
      sortBy: SortByEnum = createdAt
      sortOrder: OrderEnum = desc
    ): AllReviewResult
  }

  # Mutation Type Definitions
  type Mutation {
    blockUsers(userIds: [ID]): [User]
    blockBusinesses(businessIds: [ID]): [Business]
    verifyBusinesses(businessIds: [ID]): [Business]
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
      price: Float!
      duration: Int!
      features: [String!]!
      tierLevel: Int
      toDelete: Boolean
    ): BusinessSubscription
    manageLanguage(languages: [LanguageInput]): [Language]
    manageProficiency(proficiencies: [ProficiencyInput]): [Proficiency]
    manageCourt(courts: [CourtInput]): [Court]
    manageCategory(categories: [CategoryInput]): [Category]
    manageTag(tags: [TagInput]): [Tag]
    manageCountry(countries: [CountryInput]): [Country]
    manageState(states: [StateInput]): [State]
    manageCity(cities: [CityInput]): [City]
    managePincode(pincodes: [PincodeInput]): [Pincode]
    manageTestimonial(review: [ReviewInput]): [Testimonial]
  }

  input LanguageInput {
    id: ID
    name: String!
    slug: ID
    toDelete: Boolean
  }

  input ProficiencyInput {
    id: ID
    name: String!
    slug: ID
    toDelete: Boolean
  }

  input CourtInput {
    id: ID
    name: String!
    slug: ID
    toDelete: Boolean
  }

  input CategoryInput {
    id: ID
    name: String!
    slug: ID
    categoryImage: Upload
    toDelete: Boolean
  }

  input TagInput {
    id: ID
    name: String!
    toDelete: Boolean
  }

  input CountryInput {
    id: ID
    name: String!
    slug: ID
  }

  input StateInput {
    id: ID
    name: String!
    slug: ID
    countryId: ID!
  }

  input CityInput {
    id: ID
    name: String!
    slug: ID
    stateId: ID!
  }

  input PincodeInput {
    id: ID
    code: String!
    slug: ID
    cityId: ID!
  }
  input ReviewInput {
    id: ID
    order: Int
    toDelete: Boolean
  }
`;
