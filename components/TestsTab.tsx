"use client";

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
  sections: TestSection[];
  deploymentRuns?: DeploymentRun[];
}

function formatRunDate(d: Date): string {
  const date = new Date(d);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TestsTab({ sections, deploymentRuns = [] }: Props) {
  if (sections.length === 0 && deploymentRuns.length === 0) {
    return (
      <p className="text-[13px] text-gray-400 py-4">No test flows defined yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* DEPLOYMENT RUNS first */}
      {deploymentRuns.length > 0 && (
        <section>
          <h3 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-3">
            DEPLOYMENT RUNS
          </h3>
          <div className="flex flex-col gap-3">
            {deploymentRuns.map((run) => {
              const allPassed = run.failedCount === 0;
              const summary =
                run.failedCount > 0
                  ? `${run.passedCount} passed ${run.failedCount} failed`
                  : `${run.passedCount} passed`;
              const env = run.environment ?? "Run";
              const version = run.version ? ` ${run.version}` : "";
              const dateStr = formatRunDate(run.runAt);
              const bySource = run.source ? ` by ${run.source}` : "";

              return (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
                >
                  <div>
                    <span className="text-[13px] font-medium text-gray-900">
                      {env}{version}
                    </span>
                    <span className="text-[12px] text-gray-500 ml-2">{dateStr}</span>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {summary}{bySource}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${
                        allPassed
                          ? "text-green-700 bg-green-50 border border-green-200"
                          : "text-red-700 bg-red-50 border border-red-200"
                      }`}
                    >
                      {allPassed ? "All passed" : `${run.failedCount} failing`}
                    </span>
                    {run.detailsUrl && (
                      <a
                        href={run.detailsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="View details"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Test suite sections */}
      {sections.map((section, i) => (
        <section key={i}>
          <h3 className="text-[16px] font-semibold text-gray-900 mb-3">
            {section.title}
          </h3>
          <ul className="flex flex-col divide-y divide-gray-50/80">
            {section.testCases.map((tc) => (
              <li key={tc.id} className="py-3.5">
                <div className="flex gap-2">
                  <span className="font-mono text-[11px] font-medium text-gray-500 shrink-0 mt-1">
                    {tc.id}
                  </span>
                  <div>
                    <span className="text-[13px] font-medium text-gray-900">
                      {tc.title}
                    </span>
                    {tc.description && (
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {tc.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
