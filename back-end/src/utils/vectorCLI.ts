import * as z from "zod";
import { cosineSimilarity } from "./cosineSimilarity.js";
const sentenceOne = process.argv[2];
const sentenceTwo = process.argv[3];

const VectorSchema = z
  .object({
    a: z.array(z.number()),
    b: z.array(z.number()),
  })
  .refine(
    (val) => {
      return val.a.length === val.b.length;
    },
    { message: "Unequal lengths of vectors are not allowed" },
  );
const vectors = { a: [1, 2, 3], b: [-1, -2, -3] };
const isSafe = VectorSchema.safeParse(vectors);
if (!isSafe.success) {
  console.log(isSafe.error);
} else {
  console.log(sentenceOne);
  console.log(sentenceTwo);
  console.log(cosineSimilarity(vectors.a, vectors.b));
}
