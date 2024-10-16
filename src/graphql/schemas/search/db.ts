import { infer as infer_, unknown } from "zod";

export const AllBusinessesSchema = unknown().optional();
export type AllBusinessesInput = infer_<typeof AllBusinessesSchema>;
