import db from "../config/database.js";

export const fetchJob = async (
  jobId: number,
): Promise<{ description: string; required_experience_years: number }> => {
  const result = await db.query(
    `SELECT description, required_experience_years
                                  FROM jobs
                                  WHERE id = $1`,
    [jobId],
  );
  if (result.rows.length === 0) {
    throw new Error(`No job with id ${jobId} found!`);
  }
  return result.rows[0];
};
