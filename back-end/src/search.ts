import fs from "fs/promises";
import path from "node:path";
import z, { any } from "zod";
import { embedText } from "./embeddings/embedder.js";
import { finalScore, initStore, searchStore } from "./vectorStore/store.js";
import { getResume } from "./models/resumes.js";
import { fetchJob } from "./models/jobs.js";

// WE have stopped using the terminal for jd and experience req too
// const jdPath = process.argv[2];
// const experienceReq: number = +process.argv[3];

// Prompt the database to get the jd and exreq

async function main() {
  const job = await fetchJob(1);
  // console.log("Search.ts is running");
  const index = await initStore();
  // const jdText: string = await fs.readFile(jdAbsolutePath, "utf-8");
  const jdVector = await embedText(job.description);
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
  // filter the resumes uploaded to this job. Hardcoded for now
  const topResultsForJob = topResults.filter((r) =>
    r.job_ids.split(",").includes(String(1)),
  );

  const grouped: Record<string, typeof topResultsForJob> = {};

  topResultsForJob.forEach((i) => {
    const contentHash = i.contentHash_chunkIndex.split("_")[0];
    (grouped[contentHash] ??= []).push(i);
  });

  // 2. Fetch fullText from DB in parallel and construct the final shape
  interface GroupedFileResult {
    fullText: string;
    chunks: {
      filename: string;
      contentHash_chunkIndex: any;
      text: string;
      job_ids: string;
      score: number;
      finalScore?: number;
    }[];
  }

  const finalGrouped: GroupedFileResult = Object.fromEntries(
    await Promise.all(
      Object.entries(grouped).map(async ([contentHash_chunkIndex, chunks]) => [
        contentHash_chunkIndex.split("_")[0],
        {
          chunks,
          fullText: await getResume(contentHash_chunkIndex.split("_")[0]),
        },
      ]),
    ),
  );

  const resultWithRerankScore = finalScore(
    job.description,
    job.required_experience_years,
    finalGrouped,
  );
  console.log(resultWithRerankScore);
}
main().catch(console.error);
