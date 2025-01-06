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

  type AllFeedbackResult {
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

    adminGetUserById(userId: ID, userSlug: ID): User

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

    adminGetBusinessById(businessId: ID, businessSlug: ID): Business

    adminSearchAllReviews(
      search: String
      page: Int = 1
      limit: Int = 10
      sortBy: SortByEnum = createdAt
      sortOrder: OrderEnum = desc
    ): AllReviewResult

    adminSearchAllFeedbacks(
      search: String
      page: Int = 1
      limit: Int = 10
      sortBy: SortByEnum = createdAt
      sortOrder: OrderEnum = desc
    ): AllFeedbackResult

    adminGetAllUserSubscriptions: [UserSubscription]

    adminGetAllBusinessSubscriptions: [BusinessSubscription]

    adminGetAllLanguages: [Language]

    adminGetAllProficiencies: [Proficiency]

    adminGetAllCourts: [Court]

    adminGetAllCategories: [Category]

    adminGetAllTags: [Tag]

    adminGetAllCountries: [Country]

    adminGetAllStates: [State]

    adminGetAllCities: [City]

    adminGetAllPincodes: [Pincode]

    adminGetAllTestimonials: [Testimonial]
  }

  # Mutation Type Definitions
  type Mutation {
    adminBlockUsers(users: [UsersBlock]): [User]
    adminBlockBusinesses(businesses: [BusinessesBlock]): [Business]
    adminVerifyBusinesses(businesses: [BusinessesVerify]): [Business]
    adminManageUserSubscriptions(
      id: ID
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      toDelete: Boolean
    ): UserSubscription
    adminManageBusinessSubscriptions(
      id: ID
      name: String!
      description: String
      price: Float!
      duration: Int!
      features: [String!]!
      tierLevel: Int
      toDelete: Boolean
    ): BusinessSubscription
    adminManageLanguages(languages: [LanguageInput]): [Language]
    adminManageProficiencies(proficiencies: [ProficiencyInput]): [Proficiency]
    adminManageCourts(courts: [CourtInput]): [Court]
    adminManageCategories(categories: [CategoryInput]): [Category]
    adminManageTags(tags: [TagInput]): [Tag]
    adminManageCountries(countries: [CountryInput]): [Country]
    adminManageStates(states: [StateInput]): [State]
    adminManageCities(cities: [CityInput]): [City]
    adminManagePincodes(pincodes: [PincodeInput]): [Pincode]
    adminManageTestimonials(testimonials: [TestimonialInput]): [Testimonial]
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
    description: String
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
