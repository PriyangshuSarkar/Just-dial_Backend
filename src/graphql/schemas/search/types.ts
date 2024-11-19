import { gql } from "graphql-tag";

export const typeDefs = gql`
  enum SortByEnum {
    ALPHABETICAL
    RATING
    PRICE
    POPULARITY
  }

  enum OrderEnum {
    ASC
    DESC
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
      cityName: String!
      businessName: String
      page: Int = 1
      limit: Int = 10
    ): [Business]
  }
`;