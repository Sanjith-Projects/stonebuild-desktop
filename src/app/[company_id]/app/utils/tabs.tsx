 "use client";
import { useState } from "react";

type TabDef = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export default function SimpleTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs row – fixed, no scroll */}
      <div className="flex border-b overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-md font-medium whitespace-nowrap ${
              active === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content – ONLY this scrolls */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
