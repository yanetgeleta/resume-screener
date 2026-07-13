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
    `insert into resumes (content_hash, full_text)
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
export const getResume = async (contentHash: string): Promise<string> => {
  const result = await db.query(
    `select full_text from resumes where content_hash = $1`,
    [contentHash],
  );
  if (result.rows.length === 0) {
    throw new Error(`Resume not found for: ${contentHash}`);
  }
  return result.rows[0].full_text;
};
