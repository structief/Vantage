// APPEND-ONLY: Do not reorder or remove entries from PALETTE.
// Existing repos have their gradient derived by index — any reorder silently changes
// every repo's colour. Only add new gradients at the end.
const PALETTE: string[] = [
  "linear-gradient(135deg, #f97316, #ec4899)",
  "linear-gradient(135deg, #8b5cf6, #3b82f6)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #14b8a6, #84cc16)",
  "linear-gradient(135deg, #e11d48, #f97316)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "linear-gradient(135deg, #a3e635, #10b981)",
  "linear-gradient(135deg, #fb923c, #fbbf24)",
  "linear-gradient(135deg, #c084fc, #f472b6)",
  "linear-gradient(135deg, #34d399, #60a5fa)",
];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

export function getRepoGradient(fullName: string): string {
  const index = djb2(fullName) % PALETTE.length;
  return PALETTE[index];
}

export function getRepoInitials(repoName: string): string {
  return repoName.slice(0, 2).toUpperCase();
}
