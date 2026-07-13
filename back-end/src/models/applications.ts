import db from "../config/database.js";

// add the resume to applications database with the necessary company informations along side it
export const addApplication = async (
  jobId: number,
  resumeHash: string,
  originalFilename: string,
) => {
  try {
    const result = await db.query(
      `insert into applications(job_id, resume_hash, original_filename)
    values($1, $2, $3)
    on conflict (job_id, resume_hash) do nothing
    returning *`,
      [jobId, resumeHash, originalFilename],
    );
    if (result.rows.length === 0) {
      throw new Error(
        "Application already exists with this company and resume",
      );
    }
    return result.rows[0];
  } catch (error) {
    console.log("Moving forward with application that already exists");
  }
};
// Get companies that was applied to with this resume
export const getJobsFromResume = async (resumeHash: string) => {
  const result = await db.query(
    `SELECT j.id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.resume_hash = $1`,
    [resumeHash],
  );
  if (result.rows.length === 0) {
    throw new Error("No other job applied to with this resume");
  }
  return result.rows;
};
