import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Upload

  type Query {
    status: String!

    getReviewWithId(
      id: ID
      userId: ID
      userSlug: ID
      businessId: ID
      businessSlug: ID
    ): Review
  }

  type Mutation {
    reviewBusiness(
      id: ID
      rating: Float
      comment: String
      businessId: ID
      businessSlug: ID
      toDelete: Boolean
    ): Business

    feedback(
      id: ID
      rating: Float
      comment: String
      toDelete: Boolean
    ): Feedback
  }
`;
