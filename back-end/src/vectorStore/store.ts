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
  metadata: { filename: string; chunkIndex: number; text: string },
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
    skillScore?: number;
    experienceScoreValue?: number;
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

// returns the array with skillScore embedded
export function skillsScore(
  jd: string,
  topResults: {
    filename: string;
    chunkIndex: number;
    text: string;
    score: number;
    skillScore?: number;
    experienceScore?: number;
  }[],
) {
  const normalizedJd = jd
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const jdSet = new Set(normalizedJd.split(" "));
  const jdMatchedSkills = matchSkills(normalizedJd);
  for (const result of topResults) {
    const normalizedResult = result.text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const resultSkillsMatch = matchSkills(normalizedResult);
    const skillsScoreValue = resultSkillsMatch.size / jdMatchedSkills.size;
    result.skillScore = skillsScoreValue;
  }
  return topResults;
}

export function experienceScore(
  experienceReq: number,
  topResults: {
    filename: string;
    chunkIndex: number;
    text: string;
    score: number;
    skillScore?: number;
    experienceScore?: number;
  }[],
) {
  for (const result of topResults) {
    if (experienceReq === 0) {
      result.experienceScore = 1;
      break;
    }
    const extractedExperience = extractYearsFromChunk(result.text);
    if (extractedExperience >= experienceReq) {
      result.experienceScore = 1;
      break;
    }
    const score =
      1 - Math.abs(extractedExperience - experienceReq) / experienceReq;
    result.experienceScore = score;
  }
  return topResults;
}
export function finalScore() {}
