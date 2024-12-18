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
