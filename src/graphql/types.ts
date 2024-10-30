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
    slug: String
    email: String
    isEmailVerified: Boolean
    isPhoneVerified: Boolean
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
    type: String
    price: Float
    duration: Int
    tierLevel: Int
    features: [String]
    businesses: [Business]
    message: String
  }

  type Business {
    id: ID
    name: String
    slug: String
    website: String
    rating: Float
    isEmailVerified: Boolean
    isPhoneVerified: Boolean
    isBusinessVerified: Boolean
    email: String
    phone: String
    type: String
    addressId: String
    address: [Address]
    latitude: Float
    longitude: Float
    companyLogo: String
    companyImages: [String]
    message: String
    token: String
    services: [Service]
    reviews: [Review]
    subscriptionId: ID
    subscriptionExpire: Date
    subscription: BusinessSubscription
    paymentVerification: Boolean
    averageRating: Float
    reviewCount: Int
    isListed: Boolean
    gstNumber: String
    licenceNumber: String
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
    slug: String
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
    addressId: ID
    subcategoryId: String
    subcategory: Subcategory
    offer: [Offer]
    booking: [Booking]
    reviews: [Review]
    averageRating: Float
    reviewCount: Int
    isListed: Boolean
  }

  type Address {
    id: ID
    streetId: ID
    street: Street
    cityId: ID
    city: City
    stateId: ID
    state: State
    countryId: ID
    country: Country
    pincodeId: ID
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
    slug: String
    pincodeId: ID
    pincode: [Pincode]
    address: [Address]
    message: String
  }

  type Pincode {
    id: ID
    code: String
    slug: String
    cityId: ID
    city: City
    streets: [Street]
    address: [Address]
    message: String
  }

  type City {
    id: ID
    name: String
    slug: String
    stateId: ID
    state: State
    pincodes: [Pincode]
    address: [Address]
    message: String
  }

  type State {
    id: ID
    name: String
    slug: String
    countryId: ID
    country: Country
    cities: [City]
    address: [Address]
    message: String
  }

  type Country {
    id: ID
    name: String
    slug: String
    state: [State]
    address: [Address]
    message: String
  }

  type Category {
    id: ID
    name: String
    slug: String
    companyImages: String
    subcategories: [Subcategory]
    message: String
  }

  type Subcategory {
    id: ID
    name: String
    slug: String
    subcategoryImage: String
    categoryId: ID
    category: Category
    services: [Service]
    message: String
  }

  type Tag {
    id: ID
    name: String
    service: [Service]
    message: String
  }

  type Facility {
    id: ID
    name: String
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
