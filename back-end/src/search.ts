import fs from "fs/promises";
import path from "node:path";
import z from "zod";
import { embedText } from "./embeddings/embedder.js";
import { finalScore, initStore, searchStore } from "./vectorStore/store.js";
import { getCandidate } from "./models/candidates.js";

const jdPath = process.argv[2];
const experienceReq: number = +process.argv[3];
if (!jdPath) {
  console.error(
    "No file has been found in the path. Please input a path with valid jd",
  );
  process.exit(1);
}
const FileInput = z.object({ path: z.string().min(1) });
const input = FileInput.safeParse({ path: jdPath });

if (!input.success) {
  console.error("Invalid file path: ", input.error.issues);
  process.exit(1);
}
const jdAbsolutePath = path.resolve(jdPath);
async function main() {
  console.log("Search.ts is running");
  const index = await initStore();
  const jdText: string = await fs.readFile(jdAbsolutePath, "utf-8");
  const jdVector = await embedText(jdText);
  // Both query text and topKNumber will come from input field in the future
  // always overfetch by 4 fold since most resumes have multiple chunks
  const topResults = await searchStore(
    index,
    jdVector,
    "Typescript SQL Docker",
    40,
  );
  // skills and experience should be calculated per resume, so we will do this with that
  // 1. Group the chunks into an object
  const grouped = {};
  topResults.forEach((i) => (grouped[i.filename] ??= []).push(i));

  // 2. Fetch fullText from DB in parallel and construct the final shape
  interface GroupedFileResult {
    fullText: string;
    chunks: {
      filename: string;
      chunkIndex: number;
      text: string;
      score: number;
      finalScore?: number;
    }[];
  }
  const finalGrouped: GroupedFileResult = Object.fromEntries(
    await Promise.all(
      Object.entries(grouped).map(async ([filename, chunks]) => [
        filename,
        { chunks, fullText: await getCandidate(filename) },
      ]),
    ),
  );

  const resultWithRerankScore = finalScore(jdText, experienceReq, finalGrouped);
  console.log(resultWithRerankScore);
}
main().catch(console.error);
