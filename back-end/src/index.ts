import path from "path";
import * as z from "zod";
import fs from "fs/promises";
import { parsePDf } from "./ingestion/pdfParser.js";
import { chunkText } from "./ingestion/chunker.js";
import { embedText } from "./embeddings/embedder.js";
import { addToStore, initStore } from "./vectorStore/store.js";

const folderPath = process.argv[2];
if (!folderPath) {
  console.error("No folder has been given. Please input a folder!");
  process.exit(1);
}
const absoluteFolderPath = path.resolve(folderPath);

async function getFilesPath(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir);
  return files
    .filter((file) => path.extname(file).toLowerCase() === ".pdf")
    .map((file) => path.join(dir, file));
}

const FolderInput = z.object({ path: z.string().min(1) });
const input = FolderInput.safeParse({ path: folderPath });
if (!input.success) {
  console.error("Invalid folder input", input.error.issues);
  process.exit(1);
}

async function main() {
  const files: string[] = await getFilesPath(absoluteFolderPath);
  let id: number = 0;
  const index = await initStore();
  for (const file of files) {
    // read the file and chunk the text
    const buffer = await fs.readFile(file);
    const text = await parsePDf(buffer);
    const chunks = chunkText(text, 200, 20);

    // embed the chunks separetely and add them to vectra to store as vectors
    for (const [chunkIndex, chunk] of chunks.entries()) {
      const vector = await embedText(chunk);
      addToStore(index, vector, {
        filename: path.basename(file),
        chunkIndex: chunkIndex,
        text: chunk,
      });
      console.log(
        `[${path.basename(file)}] Chunk ${chunkIndex + 1} embedded and stored`,
      );
      id++;
    }
    // await fs.writeFile("data/chunkMap.json", JSON.stringify(chunkMap, null, 2));
  }
}
main().catch(console.error);
