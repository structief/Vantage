"use client";

import { useState, useCallback } from "react";
import { extractCriteriaCount, deriveStatus } from "@/lib/spec-utils";
import SpecTitleSection from "@/components/SpecTitleSection";
import CriteriaProgressBar from "@/components/CriteriaProgressBar";
import SpecTabBar, { type SpecTab } from "@/components/SpecTabBar";
import SpecMarkdownRenderer from "@/components/SpecMarkdownRenderer";
import CriteriaTab from "@/components/CriteriaTab";
import FileListTab from "@/components/FileListTab";

interface Props {
  markdown: string;
  filename: string;
  login: string | null;
  avatarUrl: string | null;
  date: string | null;
  contractFiles: string[];
  testFiles: string[];
}

export default function SpecDetailView({
  markdown,
  filename,
  login,
  avatarUrl,
  date,
  contractFiles,
  testFiles,
}: Props) {
  const [activeTab, setActiveTab] = useState<SpecTab>("overview");
  const [validatedIndices, setValidatedIndices] = useState<Set<number>>(new Set());

  const criteriaCount = extractCriteriaCount(markdown);
  const status = deriveStatus(validatedIndices.size, criteriaCount);

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
            contractsCount={contractFiles.length}
            testsCount={testFiles.length}
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
          <FileListTab files={contractFiles} emptyMessage="No contracts defined yet." />
        )}
        {activeTab === "tests" && (
          <FileListTab files={testFiles} emptyMessage="No test flows defined yet." />
        )}
      </div>
    </div>
  );
}
