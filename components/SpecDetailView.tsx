"use client";

import { useState, useCallback, useEffect } from "react";
import { extractCriteriaCount, deriveStatus } from "@/lib/spec-utils";
import { useSpecStatus } from "@/components/SpecStatusContext";
import SpecTitleSection from "@/components/SpecTitleSection";
import CriteriaProgressBar from "@/components/CriteriaProgressBar";
import SpecTabBar, { type SpecTab } from "@/components/SpecTabBar";
import SpecMarkdownRenderer from "@/components/SpecMarkdownRenderer";
import CriteriaTab from "@/components/CriteriaTab";
import ContractsTab from "@/components/ContractsTab";
import TestsTab from "@/components/TestsTab";
import type { OpenApiEndpoint, JsonSchemaDefinition, PrismaModel } from "@/lib/contract-parsers";
import type { TestSection } from "@/lib/parse-flow-md";

interface DeploymentRun {
  id: string;
  version: string | null;
  environment: string | null;
  runAt: Date;
  passedCount: number;
  failedCount: number;
  source: string | null;
  detailsUrl: string | null;
}

interface Props {
  markdown: string;
  filename: string;
  login: string | null;
  avatarUrl: string | null;
  date: string | null;
  apiEndpoints: OpenApiEndpoint[];
  jsonSchemaDefinitions: JsonSchemaDefinition[];
  prismaModels: PrismaModel[];
  contractsCount: number;
  testSections: TestSection[];
  deploymentRuns: DeploymentRun[];
  testsCount: number;
}

export default function SpecDetailView({
  markdown,
  filename,
  login,
  avatarUrl,
  date,
  apiEndpoints,
  jsonSchemaDefinitions,
  prismaModels,
  contractsCount,
  testSections,
  deploymentRuns,
  testsCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<SpecTab>("overview");
  const [validatedIndices, setValidatedIndices] = useState<Set<number>>(new Set());

  const criteriaCount = extractCriteriaCount(markdown);
  const status = deriveStatus(validatedIndices.size, criteriaCount);

  const { updateSpecStatus } = useSpecStatus();
  const slug = filename.replace(/^.*\//, "").replace(/\.md$/, "");

  useEffect(() => {
    updateSpecStatus(slug, status);
  }, [slug, status, updateSpecStatus]);

  const handleToggle = useCallback((index: number) => {
    setValidatedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-white min-h-screen overflow-y-auto">
      {/* Title + progress — left-aligned */}
      <div className="px-8 pt-8 max-w-6xl w-full mx-auto">
        <SpecTitleSection
          markdown={markdown}
          filename={filename}
          login={login}
          avatarUrl={avatarUrl}
          date={date}
          status={status}
        />
        <CriteriaProgressBar total={criteriaCount} validated={validatedIndices.size} />
      </div>

      {/* Tab bar — centered, sits on the border */}
      <div className="border-b border-gray-100">
        <div className="mx-auto w-full max-w-4xl px-8">
          <SpecTabBar
            activeTab={activeTab}
            criteriaCount={criteriaCount}
            contractsCount={contractsCount}
            testsCount={testsCount}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Content — same centered column as tab bar */}
      <div className="mx-auto w-full max-w-4xl px-8 py-8">
        {activeTab === "overview" && <SpecMarkdownRenderer markdown={markdown} />}
        {activeTab === "criteria" && (
          <CriteriaTab
            markdown={markdown}
            validatedIndices={validatedIndices}
            onToggle={handleToggle}
          />
        )}
        {activeTab === "contracts" && (
          <ContractsTab
            apiEndpoints={apiEndpoints}
            jsonSchemaDefinitions={jsonSchemaDefinitions}
            prismaModels={prismaModels}
          />
        )}
        {activeTab === "tests" && (
          <TestsTab sections={testSections} deploymentRuns={deploymentRuns} />
        )}
      </div>
    </div>
  );
}
