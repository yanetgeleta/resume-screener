import path from "path";
import * as z from "zod";
import fs from "fs/promises";
import { parsePDf } from "./ingestion/pdfParser.js";
import { chunkText } from "./ingestion/chunker.js";
import { embedText } from "./embeddings/embedder.js";
import { addToStore, chunkExists, initStore } from "./vectorStore/store.js";
import { addResume } from "./models/candidates.js";
import { createHash } from "crypto";

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
  const index = await initStore();
  for (const file of files) {
    // read the file and chunk the text
    const buffer = await fs.readFile(file);
    const text = await parsePDf(buffer);
    // add text to candidates here. along with their metadata
    const contentHash = createHash("sha256").update(text).digest("hex");
    const addResumeResult = await addResume(contentHash, text);
    const chunks = chunkText(text, 200, 20);

    // embed the chunks separetely and add them to vectra to store as vectors
    for (const [chunkIndex, chunk] of chunks.entries()) {
      const vector = await embedText(chunk);
      const exists = await chunkExists(index, path.basename(file), chunkIndex);
      if (!exists) {
        // Query the companies that have connection with this resume from applications
        // one will be the company that uploadded it
        await addToStore(index, vector, {
          filename: path.basename(file),
          contentHash_chunkIndex: `${contentHash}_${chunkIndex}`,
          text: chunk,
          company_name: "test",
        });
        console.log(
          `[${path.basename(file)}] Chunk ${chunkIndex + 1} embedded and stored`,
        );
      } else {
        console.log(
          `[${path.basename(file)}] Chunk ${chunkIndex + 1} already exists in store`,
        );
      }
    }
  }
  console.log(
    "✅ Ingestion sequence completed successfully. Terminating process.",
  );
  process.exit(0);
}
main().catch((error) => {
  console.error("❌ Fatal error during execution sequence:", error);
  process.exit(1);
});
