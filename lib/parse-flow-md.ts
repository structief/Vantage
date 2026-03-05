/**
 * Parser for .flow.md test flow files.
 * Extracts Flow blocks and groups them by Type for the Tests tab visualisation.
 */

export interface ParsedFlow {
  name: string;
  type: "unit" | "contract" | "e2e";
  spec: string;
  setup: string[];
  steps: string[];
  expected: string[];
  description: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
}

export interface TestSection {
  type: "unit" | "contract" | "e2e";
  title: string;
  testCases: TestCase[];
}

const FLOW_BLOCK_REGEX = /^## Flow:\s*(.+)$/m;
const TYPE_REGEX = /^Type:\s*(unit|contract|e2e)\s*$/m;
const SPEC_REGEX = /^Spec:\s*(.+)$/m;
const SETUP_REGEX = /^Setup:\s*([\s\S]*?)(?=^Steps:|^Expected:|^Edge cases:|\n\n|(?!.))/m;
const STEPS_REGEX = /^Steps:\s*([\s\S]*?)(?=^Expected:|^Edge cases:|\n\n|(?!.))/m;
const EXPECTED_REGEX = /^Expected:\s*([\s\S]*?)(?=^Edge cases:|\n\n|(?!.))/m;
const BULLET_LINE = /^-\s*(.+)$/gm;
const NUMBERED_LINE = /^\d+\.\s*(.+)$/gm;

function extractSection(
  block: string,
  regex: RegExp,
  itemPattern: RegExp = BULLET_LINE
): string[] | null {
  const m = block.match(regex);
  if (!m) return null;
  const content = m[1].trim();
  if (!content) return [];
  const lines: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(itemPattern.source, "gm");
  while ((match = re.exec(content)) !== null) {
    lines.push(match[1].trim());
  }
  if (lines.length === 0 && content) {
    lines.push(content);
  }
  return lines;
}

function extractFirstExpectedOrSteps(block: string): string {
  const expectedMatch = block.match(EXPECTED_REGEX);
  if (expectedMatch) {
    const content = expectedMatch[1].trim();
    const firstBullet = content.match(/^-\s*(.+)$/m);
    if (firstBullet) return firstBullet[1].trim();
    const firstLine = content.split("\n")[0]?.trim();
    if (firstLine && firstLine.startsWith("-")) {
      return firstLine.replace(/^-\s*/, "").trim();
    }
    if (firstLine) return firstLine;
  }
  const stepsMatch = block.match(STEPS_REGEX);
  if (stepsMatch) {
    const content = stepsMatch[1].trim();
    const firstStep = content.match(/^\d+\.\s*(.+)$/m);
    if (firstStep) return firstStep[1].trim();
  }
  return "";
}

/**
 * Parse .flow.md content into Flow blocks.
 */
export function parseFlowMd(content: string): ParsedFlow[] {
  const flows: ParsedFlow[] = [];
  const blocks = content.split(/(?=^## Flow:)/m).filter((b) => b.trim());

  for (const block of blocks) {
    const flowMatch = block.match(FLOW_BLOCK_REGEX);
    if (!flowMatch) continue;

    const name = flowMatch[1].trim();

    const typeMatch = block.match(TYPE_REGEX);
    const type = (typeMatch?.[1] ?? "e2e") as "unit" | "contract" | "e2e";
    if (!["unit", "contract", "e2e"].includes(type)) continue;

    const specMatch = block.match(SPEC_REGEX);
    const spec = specMatch?.[1]?.trim() ?? "";

    const setup = extractSection(block, SETUP_REGEX) ?? [];
    const steps = extractSection(block, STEPS_REGEX, NUMBERED_LINE) ?? [];
    const expected = extractSection(block, EXPECTED_REGEX) ?? [];
    const description = extractFirstExpectedOrSteps(block);

    flows.push({ name, type, spec, setup, steps, expected, description });
  }

  return flows;
}

const TYPE_ORDER: ("unit" | "contract" | "e2e")[] = ["unit", "contract", "e2e"];
const TYPE_TITLES: Record<string, string> = {
  unit: "Unit Tests",
  contract: "Contract Tests",
  e2e: "E2E Tests",
};

/**
 * Group parsed flows by Type into sections with TC-IDs.
 */
export function extractTestGroups(flows: ParsedFlow[]): TestSection[] {
  const byType = new Map<"unit" | "contract" | "e2e", ParsedFlow[]>();
  for (const flow of flows) {
    const list = byType.get(flow.type) ?? [];
    list.push(flow);
    byType.set(flow.type, list);
  }

  const sections: TestSection[] = [];
  for (const type of TYPE_ORDER) {
    const list = byType.get(type) ?? [];
    if (list.length === 0) continue;

    const testCases: TestCase[] = list.map((f, i) => ({
      id: `TC-${i + 1}`,
      title: f.name,
      description: f.description,
    }));

    sections.push({
      type,
      title: TYPE_TITLES[type] ?? `${type} Tests`,
      testCases,
    });
  }

  return sections;
}
