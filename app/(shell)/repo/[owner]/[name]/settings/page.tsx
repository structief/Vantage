interface Props {
  params: Promise<{ owner: string; name: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { owner, name } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">{owner}/{name}</p>
    </div>
  );
}
