import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!
  }

  type Mutation {
    reviewBusiness(
      id: ID
      rating: Float
      comment: String
      businessId: ID
      toDelete: Boolean
    ): Review
  }
`;
