import { adminSchema } from "./schemas/admin";
import { businessSchema } from "./schemas/business";
import { userSchema } from "./schemas/user";
import { typeDefs } from "./types";

export const schema = {
  typeDefs: [
    userSchema.typeDefs,
    businessSchema.typeDefs,
    adminSchema.typeDefs,
    typeDefs,
  ],
  resolvers: [
    userSchema.resolvers,
    businessSchema.resolvers,
    adminSchema.resolvers,
  ],
};
