export function dotProduct(a: number[], b: number[]): number {
  let result: number = 0;
  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }
  return result;
}
export function magnitude(a: number[]): number {
  let powSum: number = 0;
  for (let i = 0; i < a.length; i++) {
    powSum += a[i] * a[i];
  }
  return Math.sqrt(powSum);
}
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProductValue: number = dotProduct(a, b);
  const aMagnitude: number = magnitude(a);
  const bMagnitude: number = magnitude(b);
  const normalizer = aMagnitude * bMagnitude;
  return dotProductValue / normalizer;
}
