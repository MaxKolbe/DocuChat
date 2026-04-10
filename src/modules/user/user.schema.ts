//SCHEMA
import Joi from "joi";
import * as z from "zod";

//JOI
export const userSchema1 = Joi.object({
  number: Joi.number().required(),
  string: Joi.string().required(),
  bool: Joi.boolean().required(),
  array: Joi.array(),
});

//ZOD
export const userSchema2 = z.object({
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
export type User2 = z.infer<typeof userSchema2>;
