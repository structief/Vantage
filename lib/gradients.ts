// APPEND-ONLY: Do not reorder or remove entries from PALETTE.
// Existing repos have their gradient derived by index — any reorder silently changes
// every repo's colour. Only add new gradients at the end.
const PALETTE: string[] = [
  "linear-gradient(90deg, #ffc800, #d60303)",
  "linear-gradient(90deg,#0f5739,#3d8e66,#45c9a4,#46b5a9,#52c9eb)",
  "linear-gradient(90deg,#e6c396,#de4c71,#1925bb)",
  "linear-gradient(90deg,#0772ba,#a4c755)",
  "linear-gradient(90deg,#e4c9af,#e87a45,#e43f5a)",
  "linear-gradient(90deg,#fa4f77,#fda581,#fdc46f,#cff74c)",
  "linear-gradient(90deg,#ffd700,#ff8c00,#ff4500)",
  "linear-gradient(90deg,#af0ca9,#8800b9,#410bca)",
  "linear-gradient(90deg,#f0003c,#e935c2)",
  "linear-gradient(90deg,#025fa7,#1682d4,#00b0d0,#09d3f6,#42e3ff)",
  "linear-gradient(90deg,#35c4e3,#8baefb,#e88acb,#f9806f)",
  "linear-gradient(45deg,#040d2c,#462a8b,#c505d6)",
  "linear-gradient(90deg,#00a49b,#026773,#092c4e)",
  "linear-gradient(90deg,#f59e0b,#ef4444)",
  "linear-gradient(90deg,#6366f1,#a855f7)",
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
