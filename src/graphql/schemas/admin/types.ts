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

    adminAllUsers(
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

    adminAllBusinesses(
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

    adminSearchAllReviews(
      search: String
      page: Int = 1
      limit: Int = 10
      sortBy: SortByEnum = createdAt
      sortOrder: OrderEnum = desc
    ): AllReviewResult
  }

  # Mutation Type Definitions
  type Mutation {
    adminBlockUsers(users: [UsersBlock]): [User]
    adminBlockBusinesses(businesses: [BusinessesBlock]): [Business]
    adminVerifyBusinesses(businesses: [BusinessesVerify]): [Business]
    adminManageUserSubscription(
      id: ID
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      toDelete: Boolean
    ): UserSubscription
    adminManageBusinessSubscription(
      id: ID
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      tierLevel: Int
      toDelete: Boolean
    ): BusinessSubscription
    adminManageLanguage(languages: [LanguageInput]): [Language]
    adminManageProficiency(proficiencies: [ProficiencyInput]): [Proficiency]
    adminManageCourt(courts: [CourtInput]): [Court]
    adminManageCategory(categories: [CategoryInput]): [Category]
    adminManageTag(tags: [TagInput]): [Tag]
    adminManageCountry(countries: [CountryInput]): [Country]
    adminManageState(states: [StateInput]): [State]
    adminManageCity(cities: [CityInput]): [City]
    adminManagePincode(pincodes: [PincodeInput]): [Pincode]
    adminManageTestimonial(testimonials: [TestimonialInput]): [Testimonial]
  }

  input BusinessesVerify {
    businessSlug: ID
    businessId: ID
    verify: Boolean
  }

  input BusinessesBlock {
    businessSlug: ID
    businessId: ID
    block: Boolean
  }

  input UsersBlock {
    userSlug: ID
    userId: ID
    block: Boolean
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

  input TestimonialInput {
    id: ID
    reviewId: ID
    feedbackId: ID
    order: Int
    toDelete: Boolean
  }
`;
