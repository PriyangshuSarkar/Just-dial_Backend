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
    slug: String
    contacts: [UserContact]
    hideDetails: Boolean
    isBlocked: Boolean
    avatar: String
    subscriptionId: ID
    subscriptionExpire: Date
    paymentVerification: Boolean
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    addresses: [UserAddress]
    bookings: [Booking]
    reviews: [Review]
    subscription: UserSubscription
    message: String
    token: String
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
    token: String
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
    token: String
  }

  type Business {
    id: ID
    name: String
    slug: String
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
    bookings: [Booking]
    reviews: [Review]
    businessSupportingDocuments: [BusinessSupportingDocuments]
    businessDetails: BusinessDetails
    price: Float
    message: String
    token: String
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
    token: String
  }

  type BusinessDetails {
    id: ID
    businessId: ID
    registrationNumber: String
    license: String
    experience: Int
    teamSize: Int
    description: String
    websites: [BusinessWebsite]
    images: [BusinessImage]
    latitude: Float
    longitude: Float
    degree: [String]
    languages: [Language]
    proficiencies: [Proficiency]
    courts: [Court]
    gstNumber: String
    categoryId: ID
    category: Category
    tags: [Tag]
    addresses: [BusinessAddress]
    logo: String
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    message: String
    token: String
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
  }

  type BusinessImage {
    id: ID
    url: String
    order: Int
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetailsId: ID
    businessDetails: BusinessDetails
    message: String
    token: String
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
    token: String
  }

  type Language {
    id: ID
    name: String
    slug: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
    token: String
  }

  type Proficiency {
    id: ID
    name: String
    slug: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
    token: String
  }

  type Court {
    id: ID
    name: String
    slug: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
    token: String
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
  }

  type Category {
    id: ID
    name: String
    slug: String
    createdAt: Date
    deletedAt: Date
    categoryImage: String
    updatedAt: Date
    businessesDetails: [BusinessDetails]
    message: String
    token: String
  }

  type Tag {
    id: ID
    name: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    businessDetails: [BusinessDetails]
    message: String
    token: String
  }

  type Review {
    id: ID
    rating: Int
    comment: String
    businessId: ID
    business: Business
    userId: ID
    user: User
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
    token: String
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
    token: String
  }

  type Pincode {
    id: ID
    code: String
    slug: String
    cityId: ID
    city: City
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    message: String
    token: String
  }

  type City {
    id: ID
    name: String
    slug: String
    stateId: ID
    state: State
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    pincodes: [Pincode]
    message: String
    token: String
  }

  type State {
    id: ID
    name: String
    slug: String
    countryId: ID
    country: Country
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    cities: [City]
    message: String
    token: String
  }

  type Country {
    id: ID
    name: String
    slug: String
    createdAt: Date
    deletedAt: Date
    updatedAt: Date
    states: [State]
    message: String
    token: String
  }
`;
