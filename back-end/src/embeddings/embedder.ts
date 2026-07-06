import { pipeline } from "@huggingface/transformers";

export async function embedText(text: string): Promise<number[]> {
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );
  const response = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(response.data);
}
