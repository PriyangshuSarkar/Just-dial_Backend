import gql from "graphql-tag";
export const typeDefs = gql`
  scalar Date

  type UserSubscription {
    id: ID
    name: String
    description: String
    price: Float
    duration: Int
    features: [String]
    users: [User]
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
  }

  type User {
    id: ID
    name: String
    slug: ID
    contacts: [UserContact]
    hideDetails: Boolean
    isBlocked: Boolean
    avatar: String
    subscriptionId: ID
    subscriptionExpire: Date
    paymentVerification: Boolean
    razorpay_order_id: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    addresses: [UserAddress]
    bookings: [Booking]
    reviews: [Review]
    feedbacks: [Feedback]
    subscription: UserSubscription
    adminNotice: AdminNotice
    message: String
    token: String
    requestId: String
  }

  type UserContact {
    id: ID
    userId: ID
    type: String
    value: String
    isVerified: Boolean
    isPrimary: Boolean
    order: Int
    verifiedAt: Date
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    user: User
    message: String
    token: String
    requestId: String
  }

  type UserAddress {
    id: ID
    userId: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    user: User
    order: Int
    street: String
    city: String
    country: String
    pincode: String
    state: String
    message: String
  }

  type BusinessSubscription {
    id: ID
    name: String
    description: String
    type: String
    price: Float
    duration: Int
    features: [String]
    tierLevel: Int
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    businesses: [Business]
    message: String
  }

  type Business {
    id: ID
    name: String
    slug: ID
    primaryContacts: [BusinessPrimaryContact]
    additionalContacts: [String]
    isBusinessVerified: Boolean
    type: String
    subscriptionId: ID
    subscriptionExpire: Date
    subscription: BusinessSubscription
    averageRating: Float
    reviewCount: Int
    isListed: Boolean
    isBlocked: Boolean
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    paymentVerification: Boolean
    razorpay_order_id: String
    bookings: [Booking]
    reviews: [Review]
    feedbacks: [Feedback]
    businessSupportingDocuments: [BusinessSupportingDocuments]
    businessDetails: BusinessDetails
    adminNotice: AdminNotice
    price: Float
    message: String
    token: String
    requestId: String
  }

  type BusinessPrimaryContact {
    id: ID
    businessId: ID
    type: String
    value: String
    isVerified: Boolean
    isPrimary: Boolean
    order: Int
    verifiedAt: Date
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    business: Business
    message: String
    token: String
    requestId: String
  }

  type BusinessAddress {
    id: ID
    businessDetailsId: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: BusinessDetails
    order: Int
    street: String
    city: String
    country: String
    pincode: String
    state: String
    message: String
  }

  type BusinessDetails {
    id: ID
    business: Business
    registrationNumber: String
    license: String
    experience: Int
    teamSize: Int
    description: String
    websites: [BusinessWebsite]
    primaryWebsite: String
    coverImages: [BusinessCoverImage]
    adBannerImages: [BusinessAdBannerImage]
    mobileAdBannerImages: [BusinessMobileAdBannerImage]
    operatingHours: [BusinessOperatingHour]
    latitude: Float
    longitude: Float
    degrees: [String]
    languages: [Language]
    proficiencies: [Proficiency]
    courts: [Court]
    gstNumber: String
    categories: [Category]
    tags: [Tag]
    addresses: [BusinessAddress]
    logo: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
    token: String
    requestId: String
  }

  type BusinessSupportingDocuments {
    id: ID
    businessId: ID
    type: String
    url: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    business: Business
    message: String
  }

  type BusinessCoverImage {
    id: ID
    url: String
    order: Int
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
  }

  type BusinessAdBannerImage {
    id: ID
    url: String
    order: Int
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
  }

  type AdminBusinessAdBannerImage {
    id: ID
    order: Int
    businessAdBannerImage: BusinessAdBannerImage
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
  }

  type BusinessMobileAdBannerImage {
    id: ID
    url: String
    order: Int
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
  }

  type AdminBusinessMobileAdBannerImage {
    id: ID
    order: Int
    businessMobileAdBannerImage: BusinessMobileAdBannerImage
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
  }

  type BusinessWebsite {
    id: ID
    type: String
    url: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
  }

  enum DayOfWeek {
    SUNDAY
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
  }

  type BusinessOperatingHour {
    id: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    dayOfWeek: DayOfWeek
    openingTime: String
    closingTime: String
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
  }

  type Language {
    id: ID
    name: String
    slug: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
  }

  type Proficiency {
    id: ID
    name: String
    slug: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
  }

  type Court {
    id: ID
    name: String
    slug: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
  }

  enum AdminNoticeType {
    GLOBAL
    ALL_USER
    INDIVIDUAL_USER
    ALL_BUSINESS
    INDIVIDUAL_BUSINESS
  }

  type AdminNotice {
    id: ID
    businessId: ID
    business: Business
    userId: ID
    user: User
    type: AdminNoticeType
    note: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
  }
  type Admin {
    id: ID
    name: String
    email: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
    token: String
    requestId: String
  }

  type Category {
    id: ID
    name: String
    slug: ID
    order: Int
    description: String
    createdAt: Date
    deletedAt: Date
    categoryImage: String
    updatedAt: Date
    businessesDetails: [BusinessDetails]
    groupName: CategoryGroupName
    message: String
  }

  type CategoryGroupName {
    id: ID
    slug: ID
    name: String

    Category: [Category]
    message: String
  }

  type Tag {
    id: ID
    name: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
  }

  type Review {
    id: ID
    rating: Float
    comment: String
    businessId: ID
    business: Business
    userId: ID
    user: User
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
  }

  type Feedback {
    id: ID
    rating: Float
    comment: String
    businessId: ID
    business: Business
    userId: ID
    user: User
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
  }

  enum TestimonialType {
    REVIEW
    FEEDBACK
  }

  type Testimonial {
    id: ID
    order: Int
    type: TestimonialType
    rating: Float
    comment: String
    businessId: ID
    business: Business
    userId: ID
    user: User
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
  }

  type Booking {
    id: ID
    date: Date
    businessId: ID
    business: Business
    userId: ID
    user: User
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
  }

  type Pincode {
    id: ID
    code: String
    slug: ID
    cityId: ID
    city: City
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
  }

  type City {
    id: ID
    name: String
    slug: ID
    stateId: ID
    state: State
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    pincodes: [Pincode]
    message: String
  }

  type State {
    id: ID
    name: String
    slug: ID
    countryId: ID
    country: Country
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    cities: [City]
    message: String
  }

  type Country {
    id: ID
    name: String
    slug: ID
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    states: [State]
    message: String
  }

  type Razorpay {
    id: String!
    amount: Float!
    currency: String!
    status: String!
    receipt: String!
    created_at: Date!
    message: String
  }
`;
