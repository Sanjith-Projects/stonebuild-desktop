 "use client";

import React, { useState, Suspense } from "react";
import WarehouseForm from "./NewWarehouse";
 
const WarehouseList = React.lazy(() => import("./warehouseList"));

type TabKey = "entry" | "list";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("entry");

  return (
    <div className="px-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-300">
        <button
          onClick={() => setActiveTab("entry")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "entry"
              ? "border-b-2 border-[#103BB5] text-[#103BB5]"
              : "text-gray-500 hover:text-[#103BB5]"
          }`}
        >
          New Warehouse
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "list"
              ? "border-b-2 border-[#103BB5] text-[#103BB5]"
              : "text-gray-500 hover:text-[#103BB5]"
          }`}
        >
          Warehouse List
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "entry" && <WarehouseForm />}

        {activeTab === "list" && (
          <Suspense fallback={<div>Loading warehouses...</div>}>
            <WarehouseList />
          </Suspense>
        )}
      </div>
    </div>
  );
}
