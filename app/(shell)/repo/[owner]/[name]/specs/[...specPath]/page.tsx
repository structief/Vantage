import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  fetchSpecFileContent,
  fetchFileContent,
  fetchLastCommit,
  fetchDirectoryListing,
} from "@/lib/github-spec";
import {
  extractRequirementState,
  deriveStatus,
} from "@/lib/spec-utils";
import {
  parseOpenApi,
  parseJsonSchema,
  parsePrismaSchema,
  type OpenApiEndpoint,
  type JsonSchemaDefinition,
  type PrismaModel,
} from "@/lib/contract-parsers";
import {
  parseFlowMd,
  extractTestGroups,
  type TestSection,
  type ParsedFlow,
} from "@/lib/parse-flow-md";
import { prisma } from "@/lib/db";
import SpecDetailView from "@/components/SpecDetailView";

interface Props {
  params: Promise<{ owner: string; name: string; specPath: string[] }>;
}

export default async function SpecDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { owner, name, specPath } = await params;
  const token = (session as { accessToken?: string }).accessToken ?? "";

  // specPath = [...changePath, specFilename]
  // e.g. ["spec-detail-view", "feature-spec-detail-view"]
  // e.g. ["archive", "2026-03-04-xxx", "feature"]
  const specFilename = specPath[specPath.length - 1];
  const changePath = specPath.slice(0, -1).join("/");
  const basePath = `openspec/changes/${changePath}`;
  const filePath = `${basePath}/specs/${specFilename}.md`;

  const [specResult, commitInfo, apiFiles, dataFiles, schemaResult, testFiles] =
    await Promise.all([
      fetchSpecFileContent(token, owner, name, filePath),
      fetchLastCommit(token, owner, name, filePath),
      fetchDirectoryListing(token, owner, name, `${basePath}/contracts/api`),
      fetchDirectoryListing(token, owner, name, `${basePath}/contracts/data`),
      fetchFileContent(token, owner, name, `${basePath}/data-model/schema.prisma`),
      fetchDirectoryListing(token, owner, name, `${basePath}/tests`),
    ]);

  const apiEndpoints: OpenApiEndpoint[] = [];
  const jsonSchemaDefinitions: JsonSchemaDefinition[] = [];
  let prismaModels: PrismaModel[] = [];

  for (const fn of apiFiles) {
    const res = await fetchFileContent(token, owner, name, `${basePath}/contracts/api/${fn}`);
    if (res?.content) {
      const endpoints = parseOpenApi(res.content, fn);
      if (endpoints) apiEndpoints.push(...endpoints);
    }
  }

  for (const fn of dataFiles) {
    const res = await fetchFileContent(token, owner, name, `${basePath}/contracts/data/${fn}`);
    if (res?.content) {
      const defs = parseJsonSchema(res.content, fn);
      if (defs) jsonSchemaDefinitions.push(...defs);
    }
  }

  if (schemaResult?.content) {
    const models = parsePrismaSchema(schemaResult.content, "schema.prisma");
    if (models) prismaModels = models;
  }

  const contractsCount =
    apiFiles.length + dataFiles.length + (schemaResult ? 1 : 0);

  const flowFiles = testFiles.filter((f) => f.endsWith(".flow.md"));
  const allFlows: ParsedFlow[] = [];
  for (const fn of flowFiles) {
    const res = await fetchFileContent(token, owner, name, `${basePath}/tests/${fn}`);
    if (res?.content) {
      try {
        const flows = parseFlowMd(res.content);
        allFlows.push(...flows);
      } catch {
        // Parse failure: skip this file
      }
    }
  }
  const testSections: TestSection[] = extractTestGroups(allFlows);
  const testGroupCount = testSections.length;

  const repoFullName = `${owner}/${name}`;
  const specSlug = specFilename;
  const deploymentRuns = await prisma.testRun.findMany({
    where: { repoFullName, changePath, specSlug },
    orderBy: { runAt: "desc" },
    take: 5,
  });

  if (!specResult) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center px-4">
        <p className="text-[15px] font-medium text-gray-800 mb-1">Spec not found</p>
        <p className="text-[13px] text-gray-500 mb-6">
          No spec file found at <code className="text-gray-700">{filePath}</code>
        </p>
        <Link
          href={`/repo/${owner}/${name}/specs`}
          className="text-[13px] text-brand-600 hover:text-brand-700 font-medium"
        >
          ← Back to All Specs
        </Link>
      </div>
    );
  }

  const { names, validatedIndices: initialValidatedIndices } =
    extractRequirementState(specResult.markdown);
  const status = deriveStatus(initialValidatedIndices.size, names.length);

  await prisma.specStatusCache.upsert({
    where: {
      repoFullName_specPath: {
        repoFullName,
        specPath: filePath,
      },
    },
    create: {
      repoFullName,
      specPath: filePath,
      status,
      fetchedAt: new Date(),
    },
    update: {
      status,
      fetchedAt: new Date(),
    },
  });

  return (
    <SpecDetailView
      markdown={specResult.markdown}
      filename={specFilename}
      login={commitInfo?.login ?? null}
      avatarUrl={commitInfo?.avatarUrl ?? null}
      date={commitInfo?.date ?? null}
      apiEndpoints={apiEndpoints}
      jsonSchemaDefinitions={jsonSchemaDefinitions}
      prismaModels={prismaModels}
      contractsCount={contractsCount}
      testSections={testSections}
      deploymentRuns={deploymentRuns}
      testsCount={testGroupCount}
      initialValidatedIndices={initialValidatedIndices}
      repoFullName={repoFullName}
      specPath={filePath}
    />
  );
}
