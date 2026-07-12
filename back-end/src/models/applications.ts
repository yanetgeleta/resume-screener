import db from "../config/database.js";

// add the resume to applications database with the necessary company informations along side it
export const addApplication = async (
  companyId: number,
  resumeHash: string,
  originalFilename: string,
) => {
  const result = await db.query(
    `insert into applications(company_id, resume_hash, original_filename)
    values($1, $2, $3)
    on conflict (company_id, resume_hash) do nothing
    returning *`,
    [companyId, resumeHash, originalFilename],
  );
  if (result.rows.length === 0) {
    throw new Error("Application already existed with this company and resume");
  }
  return result.rows[0];
};
// Get companies that was applied to with this resume
export const getCompaniesFromResume = async (resumeHash: string) => {
  const result = await db.query(
    `SELECT c.name FROM applications a JOIN companies c ON c.id = a.company_id WHERE a.resume_hash = $1`,
    [resumeHash],
  );
  if (result.rows.length === 0) {
    throw new Error(
      "No other companies found where this resume was applied with",
    );
  }
  return result.rows;
};
