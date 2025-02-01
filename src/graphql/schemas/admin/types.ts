import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload
  # Enums
  enum AllUsersSortBy {
    alphabetical
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
    alphabetical
    createdAt
    updatedAt
    averageRating
    reviewCount
  }

  enum AllTestimonialType {
    REVIEW
    FEEDBACK
  }

  enum AllTestimonialFilter {
    BUSINESS
    USER
  }

  type AllUsersResult {
    users: [User]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }
  type AllBusinessesResult {
    businesses: [Business]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }
  type AllReviewsResult {
    reviews: [Review]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type AllFeedbacksResult {
    reviews: [Review]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type AllTestimonialsResult {
    testimonials: [Testimonial]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type AllAdminNoticesResult {
    notices: [AdminNotice]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type AllAdminBusinessAdBannerImagesResult {
    images: [BusinessAdBannerImage]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type AllAdminBusinessMobileAdBannerImagesResult {
    images: [BusinessMobileAdBannerImage]
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
      page: Int
      limit: Int
      sortBy: AllUsersSortBy = createdAt
      sortOrder: SortOrder = desc
      hasAdminNotice: Boolean = false
      hasReviews: Boolean
      hasFeedbacks: Boolean
      hasTestimonials: Boolean
    ): AllUsersResult

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
      page: Int
      limit: Int
      sortBy: AllBusinessesSortBy = createdAt
      sortOrder: SortOrder = desc
      hasReviews: Boolean
      hasFeedbacks: Boolean
      hasBusinessAdBanners: Boolean
      hasBusinessMobileAdBanners: Boolean
      hasAdminNotice: Boolean
      hasAdminBusinessAdBanners: Boolean
      hasAdminBusinessMobileAdBanners: Boolean
      hasTestimonials: Boolean
    ): AllBusinessesResult

    adminGetBusinessById(businessId: ID, businessSlug: ID): Business

    adminSearchAllReviews(
      search: String
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllReviewsResult

    adminSearchAllFeedbacks(
      search: String
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllFeedbacksResult

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

    adminGetAllTestimonials(
      type: AllTestimonialType
      filter: AllTestimonialFilter
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllTestimonialsResult

    adminGetAllAdminNotices(
      type: AdminNoticeType
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllAdminNoticesResult

    adminGetAllBusinessAdBannerImages(
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllAdminBusinessAdBannerImagesResult

    adminGetAllBusinessMobileAdBannerImages(
      page: Int
      limit: Int
      sortBy: SortByEnum
      sortOrder: OrderEnum
    ): AllAdminBusinessMobileAdBannerImagesResult
  }

  # Mutation Type Definitions
  type Mutation {
    adminChangePassword(password: String!): Admin

    adminBlockUsers(users: [UsersBlock]): [User]

    adminBlockBusinesses(businesses: [BusinessesBlock]): [Business]

    adminVerifyBusinesses(businesses: [BusinessesVerify]): [Business]

    adminDeleteReviews(reviews: [ReviewDelete]): [Review]

    adminManageUserSubscriptions(
      id: ID
      name: String
      priceDescription: String
      description: String
      price: Float
      duration: Int
      features: [String]
      toDelete: Boolean
    ): UserSubscription

    adminManageBusinessSubscriptions(
    id: ID
    name: String
    priceDescription: String
    description: String
    type: BusinessType
    price: Float
    duration: Int
    features: [String]
    order: Int
    priority: Int
    tierLevel: Int
    toDelete: Boolean
  ): BusinessSubscription
}

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

    adminManageAdminNotices(adminNotices: [AdminNoticeInput]): [AdminNotice]

    adminManageBusinessAdBannerImage(
      businessAdBannerImages: [AdminBusinessAdBannerImageInput]
    ): [AdminBusinessAdBannerImage]

    adminManageBusinessMobileAdBannerImage(
      businessMobileAdBannerImages: [AdminBusinessMobileAdBannerImageInput]
    ): [AdminBusinessMobileAdBannerImage]
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

  input ReviewDelete {
    reviewId: ID
    toDelete: Boolean
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
    name: String
    slug: ID
    order: Int
    description: String
    categoryImage: Upload
    toDelete: Boolean
    groupName: String
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

  input AdminNoticeInput {
    id: ID
    businessId: ID
    businessSlug: ID
    userId: ID
    userSlug: ID
    type: AdminNoticeType
    note: String
    toDelete: Boolean
    expiresAt: Date
  }

  input AdminBusinessAdBannerImageInput {
    id: ID
    order: Int
    toDelete: Boolean
  }

  input AdminBusinessMobileAdBannerImageInput {
    id: ID
    order: Int
    toDelete: Boolean
  }
`;
