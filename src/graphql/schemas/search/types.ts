import { gql } from "graphql-tag";

export const typeDefs = gql`
  enum SortByEnum {
    alphabetical
    rating
    price
    popularity
    experience
  }

  enum OrderEnum {
    asc
    desc
  }

  enum AllTestimonialType {
    REVIEW
    FEEDBACK
  }

  type SearchResult {
    businesses: [Business]
    categories: [Category]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type LocationResult {
    pincodes: [Pincode]
    cities: [City]
    states: [State]
    countries: [Country]
  }

  type Query {
    status: String!

    search(
      verified: Boolean
      minPrice: Float
      maxPrice: Float
      minRating: Float
      sortBy: SortByEnum
      order: OrderEnum
      categoryId: ID
      categorySlug: ID
      languages: [String!]
      courts: [String!]
      proficiencies: [String!]
      pincode: String
      city: String
      state: String
      country: String
      search: String
      page: Int = 1
      limit: Int = 10
    ): SearchResult

    getBusinessById(businessId: String, businessSlug: String): Business

    getAllBusinesses: [Business]

    allLanguages: [Language]

    allProficiencies: [Proficiency]

    allCourts: [Court]

    allCategories: [Category]

    allTags: [Tag]

    allTestimonials(
      type: AllTestimonialType
      page: Int = 1
      limit: Int = 10
    ): [Testimonial]

    location(search: String): LocationResult

    getAllAddBanners: [BusinessAdBannerImage]

    getAllMobileAddBanners: [BusinessMobileAdBannerImage]
  }
`;
