interface Props {
  params: Promise<{ owner: string; name: string }>;
}

export default async function SpecsPage({ params }: Props) {
  const { owner, name } = await params;
  return (
    <div className="flex flex-col flex-1 min-w-0 px-8 pt-8">
      <h1 className="text-[15px] font-semibold text-gray-900">All Specs</h1>
      <p className="text-[12px] text-gray-400 mt-0.5">{owner}/{name}</p>
      <p className="text-sm text-gray-400 mt-6">
        Select a spec from the sidebar to view its details.
      </p>
    </div>
  );
}
