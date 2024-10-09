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
    users: User
    message: String
  }

  type User {
    id: ID
    name: String
    email: String
    isVerified: String
    phone: String
    hideDetails: Boolean
    avatar: String
    addressId: ID
    address: [Address]
    reviews: [Review]
    bookings: [Booking]
    subscriptionId: ID
    subscription: UserSubscription
    subscriptionExpire: Date
    paymentVerification: Boolean
    message: String
    token: String
  }

  type BusinessSubscription {
    id: ID
    name: String
    description: String
    price: Float
    duration: Int
    features: [String]
    businesses: [Business]
    message: String
  }

  type Business {
    id: ID
    website: String
    rating: Float
    isVerified: Boolean
    email: String
    name: String
    phone: String
    type: String
    address: [Address]
    latitude: Float
    longitude: Float
    companyLogo: String
    companyImages: [String]
    message: String
    token: String
    service: Service
    reviews: [Review]
    averageRating: Float
    subscriptionId: ID
    subscription: BusinessSubscription
    paymentVerification: Boolean
  }

  type Admin {
    id: ID
    name: String
    email: String
    message: String
    token: String
  }

  type Service {
    id: ID
    name: String
    message: String
    overview: String
    price: Float
    businessId: ID
    business: Business
    discountedPrice: Float
    serviceImages: [String]
    tags: [Tag]
    facilities: [Facility]
    address: [Address]
    subcategoryId: String
    subcategory: Subcategory
    offer: [Offer]
    booking: [Booking]
    reviews: [Review]
    averageRating: Float
  }

  type Address {
    id: ID
    street: Street
    city: City
    state: State
    country: Country
    pincode: Pincode
    userId: ID
    user: User
    businessId: ID
    business: Business
    serviceId: ID
    service: Service
    message: String
  }

  type Street {
    id: ID
    name: String
    address: [Address]
    message: String
  }

  type City {
    id: ID
    name: String
    address: [Address]
    message: String
  }

  type State {
    id: ID
    name: String
    address: [Address]
    message: String
  }

  type Country {
    id: ID
    name: String
    address: [Address]
    message: String
  }

  type Pincode {
    id: ID
    code: String
    address: [Address]
    message: String
  }

  type Category {
    id: ID
    name: String
    subcategories: [Subcategory]
    message: String
  }

  type Subcategory {
    id: ID
    name: String
    categoryId: ID
    category: Category
    services: [Service]
    message: String
  }

  type Tag {
    id: ID
    name: String
    serviceId: ID
    service: [Service]
    message: String
  }

  type Facility {
    id: ID
    name: String
    serviceId: ID
    service: [Service]
    message: String
  }

  type Review {
    id: ID
    rating: Int
    comment: String
    serviceId: ID
    service: Service
    businessId: ID
    business: Business
    userId: ID
    user: User
    message: String
  }

  type Booking {
    id: ID
    date: Date
    userId: ID
    user: User
    serviceId: ID
    service: Service
    message: String
  }

  type Offer {
    id: ID
    title: String
    description: String
    discountRate: Float
    startDate: Date
    endDate: Date
    message: String
  }
`;
