import { adminSchema } from "./schemas/admin";
import { businessSchema } from "./schemas/business";
import { reviewSchema } from "./schemas/review";
import { searchSchema } from "./schemas/search";
import { userSchema } from "./schemas/user";
import { typeDefs } from "./types";

export const schema = {
  typeDefs: [
    userSchema.typeDefs,
    businessSchema.typeDefs,
    adminSchema.typeDefs,
    searchSchema.typeDefs,
    reviewSchema.typeDefs,
    typeDefs,
  ],
  resolvers: [
    userSchema.resolvers,
    businessSchema.resolvers,
    adminSchema.resolvers,
    searchSchema.resolvers,
    reviewSchema.resolvers,
  ],
};
