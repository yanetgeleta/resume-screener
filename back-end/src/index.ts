import path from "path";
import * as z from "zod";
import fs from "fs/promises";
import { parsePDf } from "./ingestion/pdfParser.js";
import { chunkText } from "./ingestion/chunker.js";

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
  for (const file of files) {
    const buffer = await fs.readFile(file);
    const text = await parsePDf(buffer);
    const chunks = chunkText(text, 200, 20);
    // console.log(chunks);
    chunks.forEach((chunk, index) => {
      console.log(`[${path.basename(file)}] Chunk ${index + 1}:\n${chunk}\n`);
    });
  }
  console.log(absoluteFolderPath);
}
main().catch(console.error);
