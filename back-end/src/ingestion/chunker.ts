export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  if (!text.trim()) {
    throw new Error(
      "Cannot chunk empty text — PDF may be image-based or unreadable",
    );
  }
  const chunks: string[] = [];
  const words: string[] = text.trim().split(/\s+/); // here we have array of every words from the resume
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    // next stop will be the size minus the overlap
    const chunkWords: string[] = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(" ")); // joins the singular chunkword by using space and pushes it to the chunks
  }

  return chunks;
}
