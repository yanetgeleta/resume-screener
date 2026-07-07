import { pipeline } from "@huggingface/transformers";
import { redis } from "../cache/redisClient.js";
import { createHash } from "node:crypto";

const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);
export async function embedText(text: string): Promise<number[]> {
  const key = `embedding:${createHash("sha256").update(text).digest("hex")}`;
  const cachedVec = await redis.get(key);
  if (cachedVec) {
    return JSON.parse(cachedVec) as number[];
  }

  const response = await extractor(text, { pooling: "mean", normalize: true });
  const vectorArr = Array.from(response.data);
  await redis.setex(key, 10800, JSON.stringify(vectorArr));
  return vectorArr;
}
