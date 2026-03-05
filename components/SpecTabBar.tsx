export type SpecTab = "overview" | "criteria" | "contracts" | "tests";

interface TabDef {
  id: SpecTab;
  label: string;
  badge?: number;
}

interface Props {
  activeTab: SpecTab;
  criteriaCount: number;
  contractsCount: number;
  testsCount: number;
  onTabChange: (tab: SpecTab) => void;
}

export default function SpecTabBar({
  activeTab,
  criteriaCount,
  contractsCount,
  testsCount,
  onTabChange,
}: Props) {
  const tabs: TabDef[] = [
    { id: "overview", label: "Overview" },
    { id: "criteria", label: "Criteria", badge: criteriaCount > 0 ? criteriaCount : undefined },
    { id: "contracts", label: "Contracts", badge: contractsCount > 0 ? contractsCount : undefined },
    { id: "tests", label: "Tests", badge: testsCount > 0 ? testsCount : undefined },
  ];

  return (
    <div className="flex items-end gap-1 -mb-px">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none rounded-t ${
              isActive
                ? "text-gray-900 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-medium leading-none min-w-[16px] ${
                  isActive ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}
