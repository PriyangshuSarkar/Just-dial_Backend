import { gql } from "graphql-tag";

export const typeDefs = gql`
  enum SortByEnum {
    alphabetical
    rating
    price
    popularity
  }

  enum OrderEnum {
    asc
    desc
  }

  type SearchResult {
    businesses: [Business]
    categories: [Category]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
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
      languages: [String!]
      courts: [String!]
      proficiencies: [String!]
      cityName: String
      search: String
      page: Int = 1
      limit: Int = 10
    ): SearchResult

    getBusinessById(businessId: String!): Business

    allLanguages: [Language]

    allProficiencies: [Proficiency]

    allCourts: [Court]

    allCategories: [Category]

    allTags: [Tag]

    areas(search: String!): [Pincode]
  }
`;
