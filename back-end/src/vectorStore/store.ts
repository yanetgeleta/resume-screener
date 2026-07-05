import { LocalIndex } from "vectra";
import path from "node:path";

const INDEX_PATH = path.resolve("data/index");

export async function initStore(maxElements: number): Promise<LocalIndex> {
  const index = new LocalIndex(INDEX_PATH);
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }
  return index;
}
export async function addToStore(
  index: LocalIndex,
  vector: number[],
  metadata: { filename: string; chunkIndex: number; text: string },
): Promise<void> {
  await index.insertItem({ vector, metadata });
}
export async function searchStore(
  index: LocalIndex,
  queryVector: number[],
  queryText: string,
  k: number,
): Promise<
  { filename: string; chunkIndex: number; text: string; score: number }[]
> {
  const results = await index.queryItems(queryVector, queryText, k);
  return results.map((r) => ({
    ...(r.item.metadata as {
      filename: string;
      chunkIndex: number;
      text: string;
    }),
    score: r.score,
  }));
}
