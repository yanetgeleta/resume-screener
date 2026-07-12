import db from "../config/database.js";

interface ResumeRow {
  content_hash: string;
  full_text: string;
  parsed_at: Date; // pg driver automatically parses timestamptz/timestamp to JavaScript Date
}
export const addResume = async (
  contentHash: string,
  full_text: string,
): Promise<string | ResumeRow> => {
  const result = await db.query(
    `insert into candidates (content_hash, full_text)
    values($1, $2)
    on conflict (content_hash) do update set content_hash = excluded.content_hash
    returning *`,
    [contentHash, full_text],
  );
  if (result.rows.length === 0) {
    return "Failed to add resume to the database";
  }
  return result.rows[0];
};

// we are gonna change this
export const getCandidate = async (filename: string): Promise<string> => {
  const result = await db.query(
    `select full_text from candidates where filename = $1`,
    [filename],
  );
  if (result.rows.length === 0) {
    throw new Error(`Candidate info not found for file: ${filename}`);
  }
  return result.rows[0].full_text;
};
