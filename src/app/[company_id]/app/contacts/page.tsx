 "use client";

import React, { useState, Suspense, useEffect } from "react";
import ContactForm from "./NewContact";
import { useSearchParams } from "next/navigation";

const ContactList = React.lazy(() => import("./ContactList"));

type TabKey = "entry" | "list";

export default function Page() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit-id");

  const [activeTab, setActiveTab] = useState<TabKey>("entry");

  // If edit-id exists, force tab to "entry"
  useEffect(() => {
    if (editId) {
      setActiveTab("entry");
    }
  }, [editId]);

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
          New Contact
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "list"
              ? "border-b-2 border-[#103BB5] text-[#103BB5]"
              : "text-gray-500 hover:text-[#103BB5]"
          }`}
        >
          Contact List
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "entry" && (
           <ContactForm editId={editId} />
        )}

        {activeTab === "list" && (
          <Suspense fallback={<div>Loading contacts...</div>}>
            <ContactList />
          </Suspense>
        )}
      </div>
    </div>
  );
}
