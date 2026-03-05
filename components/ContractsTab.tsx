"use client";

import type {
  OpenApiEndpoint,
  JsonSchemaDefinition,
  PrismaModel,
} from "@/lib/contract-parsers";

interface Props {
  apiEndpoints: OpenApiEndpoint[];
  jsonSchemaDefinitions: JsonSchemaDefinition[];
  prismaModels: PrismaModel[];
}

function ParamTable({
  rows,
  cols,
}: {
  rows: { name: string; required?: boolean; type: string; description?: string }[];
  cols: ("name" | "required" | "type" | "description")[];
}) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr className="border-b border-gray-100">
          {cols.includes("name") && (
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Field</th>
          )}
          {cols.includes("required") && (
            <th className="text-left py-2 pr-4 font-medium text-gray-700 w-20">Req</th>
          )}
          {cols.includes("type") && (
            <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
          )}
          {cols.includes("description") && (
            <th className="text-left py-2 font-medium text-gray-700">Description</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-gray-50">
            {cols.includes("name") && (
              <td className="py-2 pr-4 font-mono text-[12px] text-gray-900">{r.name}</td>
            )}
            {cols.includes("required") && (
              <td className="py-2 pr-4 text-[12px] text-gray-500">
                {r.required ? "required" : ""}
              </td>
            )}
            {cols.includes("type") && (
              <td className="py-2 pr-4 font-mono text-[12px] text-gray-600">{r.type}</td>
            )}
            {cols.includes("description") && (
              <td className="py-2 text-[12px] text-gray-500">{r.description ?? ""}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 mb-6 last:mb-0">
      <h3 className="text-[16px] font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ContractsTab({
  apiEndpoints,
  jsonSchemaDefinitions,
  prismaModels,
}: Props) {
  const hasContent =
    apiEndpoints.length > 0 ||
    jsonSchemaDefinitions.length > 0 ||
    prismaModels.length > 0;

  if (!hasContent) {
    return (
      <p className="text-[13px] text-gray-400 py-4">
        No contracts or data models defined yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* API contracts */}
      {apiEndpoints.map((ep, i) => (
        <Card key={i} title={`${ep.method} ${ep.path}`}>
          {(ep.summary || ep.description) && (
            <p className="text-[13px] text-gray-600 mb-4">
              {ep.summary ?? ep.description}
            </p>
          )}
          {ep.requestParameters.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                REQUEST
              </h4>
              <ParamTable
                rows={ep.requestParameters}
                cols={["name", "required", "type", "description"]}
              />
            </div>
          )}
          {ep.responseFields.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                RESPONSE
              </h4>
              <ParamTable
                rows={ep.responseFields}
                cols={["name", "type", "description"]}
              />
            </div>
          )}
          {ep.statusCodes.length > 0 && (
            <div>
              <h4 className="text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                STATUS CODES
              </h4>
              <ul className="text-[13px]">
                {ep.statusCodes.map((sc, j) => (
                  <li key={j} className="py-1 flex gap-3">
                    <span className="font-mono text-[12px] text-gray-600 w-12">
                      {sc.code}
                    </span>
                    <span className="text-gray-600">{sc.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}

      {/* JSON Schema definitions */}
      {jsonSchemaDefinitions.map((def, i) => (
        <Card key={i} title={def.title ?? def.name}>
          {def.description && (
            <p className="text-[13px] text-gray-600 mb-4">{def.description}</p>
          )}
          {def.properties.length > 0 && (
            <ParamTable
              rows={def.properties}
              cols={["name", "required", "type", "description"]}
            />
          )}
        </Card>
      ))}

      {/* Prisma models */}
      {prismaModels.map((model, i) => (
        <Card key={i} title={model.name}>
          {model.fields.length > 0 ? (
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Field</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 font-medium text-gray-700">Modifiers</th>
                </tr>
              </thead>
              <tbody>
                {model.fields.map((f, j) => (
                  <tr key={j} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-mono text-[12px] text-gray-900">
                      {f.name}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[12px] text-gray-600">
                      {f.type}
                    </td>
                    <td className="py-2 text-[12px] text-gray-500">
                      {f.modifiers.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
