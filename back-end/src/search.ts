import fs from "fs/promises";
import path from "node:path";
import z from "zod";
import { embedText } from "./embeddings/embedder.js";
import {
  experienceScore,
  initStore,
  searchStore,
  skillsScore,
} from "./vectorStore/store.js";

const jdPath = process.argv[2];
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
  const index = await initStore();
  const text: string = await fs.readFile(jdAbsolutePath, "utf-8");
  const jdVector = await embedText(text);
  // Both query text and topKNumber will come from input field in the future
  const topResults = await searchStore(
    index,
    jdVector,
    "Typescript SQL Docker",
    10,
  );
  const resultsWithSkillsScore = skillsScore(text, topResults);
  resultsWithSkillsScore.experienceScoreValue = experienceScore();
}
