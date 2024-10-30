import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Query {
    status: String!

    allBusinesses(page: Int, limit: Int): [Business]

    search(
      sortBy: String
      order: String
      verified: Boolean
      minPrice: Float
      maxPrice: Float
      minRating: Float
      cityName: String!
      serviceName: String!
      page: Int
      limit: Int
    ): [Service]
  }
`;
