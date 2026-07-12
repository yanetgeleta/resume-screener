import { LocalIndex } from "vectra";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { match } from "node:assert/strict";
import { number } from "zod";
import { TECH_SKILLS_DICTIONARY } from "../constants/techSkils.js";
import { extractYearsFromChunk } from "../utils/experienceExtractor.js";

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
  metadata: {
    filename: string;
    contentHash_chunkIndex: any;
    text: string;
    company_name: string;
  },
): Promise<void> {
  await index.insertItem({ vector, metadata });
}
// returns the top k candidates as an array
// returns the chunk along with file metadata
export async function searchStore(
  index: LocalIndex,
  queryVector: number[],
  queryText: string,
  k: number,
): Promise<
  {
    filename: string;
    chunkIndex: number;
    text: string;
    score: number;
    finalScore?: number;
  }[]
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

// returns skills that match the tech skills
function matchSkills(text: string) {
  const skills = TECH_SKILLS_DICTIONARY;
  const matchedSkills: Set<string> = new Set();
  for (const skill of skills) {
    if (text.includes(skill.toLocaleLowerCase())) {
      matchedSkills.add(skill);
    }
  }
  return matchedSkills;
}
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
export function finalScore(
  jd: string,
  experienceReq: number,
  finalGrouped: GroupedFileResult,
) {
  const normalizedJd = jd
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // const jdSet = new Set(normalizedJd.split(" "));
  const jdMatchedSkills = matchSkills(normalizedJd);
  for (const [filename, fileGroup] of Object.entries(finalGrouped)) {
    // Use fileGroup.fullText instead of chunk text!
    const normalizedResult = fileGroup.fullText
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const resultSkillsMatch = matchSkills(normalizedResult);
    let skillsScoreValue =
      jdMatchedSkills.size > 0
        ? resultSkillsMatch.size / jdMatchedSkills.size
        : 1;

    const extractedExperience = extractYearsFromChunk(fileGroup.fullText);
    const experienceScore =
      experienceReq === 0
        ? 1
        : extractedExperience >= experienceReq
          ? 1
          : 1 - (experienceReq - extractedExperience) / experienceReq;

    // Calculate base score from the highest-scoring chunk in this file
    const maxChunkScore = Math.max(...fileGroup.chunks.map((c) => c.score));

    // Store the final score at the file level
    fileGroup.finalScore =
      maxChunkScore * 0.5 + skillsScoreValue * 0.35 + experienceScore * 0.15;
  }

  return finalGrouped;
}
