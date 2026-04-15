//SCHEMA
import * as z from "zod";

//ZOD
export const featureSchema = z.object({
  string: z.string(),
  number: z.number(),
  bigint: z.bigint(),
  bool: z.boolean(),
  symbol: z.symbol(),
  undefined: z.undefined(),
  null: z.null(),
  email: z.email(),
  date: z.iso.date(),
  time: z.iso.time(),
  datetime: z.iso.datetime(),
  array: z.array(
    z.object({
      string: z.string().min(1),
    }),
  ),
});
export type Feature = z.infer<typeof featureSchema>;
