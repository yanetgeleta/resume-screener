import { LocalIndex } from "vectra";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, "../../data/index");

export async function initStore(): Promise<LocalIndex> {
  const index = new LocalIndex(INDEX_PATH);
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }
  return index;
}
export async function chunkExists(
  index: LocalIndex,
  filename: string,
  chunkIndex: number,
): Promise<boolean> {
  const items = await index.listItems();
  return items.some(
    (item) =>
      item.metadata.filename === filename &&
      item.metadata.chunkIndex === chunkIndex,
  );
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
