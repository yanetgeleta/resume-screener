import path from "path";
import * as z from "zod";
import fs from "fs/promises";
import { parsePDf } from "./ingestion/pdfParser.js";
import { chunkText } from "./ingestion/chunker.js";
import { embedText } from "./embeddings/embedder.js";
import { addToStore, findChunk, initStore } from "./vectorStore/store.js";
import { addResume } from "./models/resumes.js";
import { createHash } from "crypto";
import { addApplication, getJobsFromResume } from "./models/applications.js";

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
    // we add the resume so we should also add it to the applications with the current company
    // 1 is a placeholder for now since we only have 1 test job right now
    const addApplicationResult = await addApplication(
      1,
      contentHash,
      path.basename(file),
    );
    const jobsAppliedTo = await getJobsFromResume(contentHash);
    const jobIdsString = jobsAppliedTo.map((j) => j.id).join(", ");
    const chunks = chunkText(text, 200, 20);

    // embed the chunks separetely and add them to vectra to store as vectors
    for (const [chunkIndex, chunk] of chunks.entries()) {
      const existingChunk = await findChunk(
        index,
        `${contentHash}_${chunkIndex}`,
      );
      if (existingChunk) {
        // Query the companies that have connection with this resume from applications
        // one will be the company that uploadded it (for now only Test Company is uploading it)
        await index.upsertItem({
          id: existingChunk.id,
          vector: existingChunk.vector,
          metadata: {
            ...existingChunk.metadata,
            job_ids: jobIdsString,
          },
        });
        console.log(
          `[${path.basename(file)}] Chunk ${contentHash}_${chunkIndex + 1} embedded and stored`,
        );
      } else {
        // Query companies that have connection to this resume in application and update company names with their names
        // I don't want to add the vector again so if we can change the company_name with the new one it would nice
        const vector = await embedText(chunk);
        await addToStore(index, vector, {
          filename: path.basename(file),
          contentHash_chunkIndex: `${contentHash}_${chunkIndex}`,
          text: chunk,
          job_ids: jobIdsString,
        });
        console.log(
          `[${path.basename(file)}] Chunk ${contentHash}_${chunkIndex + 1} already exists in store`,
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
