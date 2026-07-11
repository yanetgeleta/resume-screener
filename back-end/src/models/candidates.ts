import db from "../config/database.js";

interface CandidateRow {
  filename: string;
  full_text: string;
  ingested_at: Date; // pg driver automatically parses timestamptz/timestamp to JavaScript Date
}
export const addCandidate = async (
  filename: string,
  full_text: string,
): Promise<string | CandidateRow> => {
  const result = await db.query(
    `insert into candidates (filename, full_text)
    values($1, $2)
    on conflict (filename) do update set full_text = excluded.full_text
    returning *`,
    [filename, full_text],
  );
  if (result.rows.length === 0) {
    return "Failed to add candidate information to database";
  }
  return result.rows[0];
};

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
