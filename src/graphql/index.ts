import { adminSchema } from "./schemas/admin";
import { businessSchema } from "./schemas/business";
import { userSchema } from "./schemas/user";

export const schema = {
  typeDefs: [
    userSchema.typeDefs,
    businessSchema.typeDefs,
    adminSchema.typeDefs,
  ],
  resolvers: [
    userSchema.resolvers,
    businessSchema.resolvers,
    adminSchema.resolvers,
  ],
};
