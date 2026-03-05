/**
 * Unit tests for lib/parse-flow-md
 */

import { describe, it, expect } from "vitest";
import { parseFlowMd, extractTestGroups } from "@/lib/parse-flow-md";

const SAMPLE_FLOW = `# Test flows: example

## Flow: First flow
Type: unit
Spec: specs/example.md > Requirement: Foo

Setup:
- Precondition 1

Steps:
1. Do action
2. Observe result

Expected:
- Returned value equals expected
- Database is updated

## Flow: Second flow
Type: e2e
Spec: specs/example.md > Requirement: Bar

Setup:
- User logged in

Steps:
1. Navigate to page
2. Click button

Expected:
- Page renders correctly
`;

describe("parseFlowMd", () => {
  it("extracts flows with name, type, and description", () => {
    const flows = parseFlowMd(SAMPLE_FLOW);

    expect(flows).toHaveLength(2);
    expect(flows[0]).toMatchObject({
      name: "First flow",
      type: "unit",
      description: "Returned value equals expected",
    });
    expect(flows[1]).toMatchObject({
      name: "Second flow",
      type: "e2e",
      description: "Page renders correctly",
    });
  });

  it("parses expected array from bullets", () => {
    const flows = parseFlowMd(SAMPLE_FLOW);
    expect(flows[0].expected.length).toBeGreaterThanOrEqual(1);
    expect(flows[0].expected).toContain("Returned value equals expected");
  });
});

describe("extractTestGroups", () => {
  it("groups flows by type with TC-IDs", () => {
    const flows = parseFlowMd(SAMPLE_FLOW);
    const sections = extractTestGroups(flows);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      type: "unit",
      title: "Unit Tests",
      testCases: [
        { id: "TC-1", title: "First flow", description: "Returned value equals expected" },
      ],
    });
    expect(sections[1]).toMatchObject({
      type: "e2e",
      title: "E2E Tests",
      testCases: [
        { id: "TC-1", title: "Second flow", description: "Page renders correctly" },
      ],
    });
  });

  it("returns empty array for empty flows", () => {
    const sections = extractTestGroups([]);
    expect(sections).toEqual([]);
  });
});
