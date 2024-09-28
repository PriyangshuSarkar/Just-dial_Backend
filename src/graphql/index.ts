import { userSchema } from "./schemas/user";

export const schema = {
  typeDefs: [userSchema.typeDefs],
  resolvers: [userSchema.resolvers],
};
