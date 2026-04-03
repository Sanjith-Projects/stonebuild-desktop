"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../utils/formField";
import { TypeaheadField } from "../utils/typeheadField";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import ConfirmModal from "../utils/confirmationModal";
import { PenIcon } from "lucide-react";

type Reminder = {
  id?: string;
  date: string;
  title: string;
  description?: string;
  assigned_to: string;
  priority: "High" | "Medium" | "Low";
  status?: "Active" | "Inactive";
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 mb-2">
    <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
    <div className="w-2/3">{children}</div>
  </div>
);

export default function ReminderPage() {
  const methods = useForm<Reminder>({
    defaultValues: {
      date: "",
      title: "",
      description: "",
      assigned_to: "",
      priority: "Medium",
    },
  });

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<Reminder | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [assignedOptions, setAssignedOptions] = useState<{ label: string; value: string }[]>([]);

  const fetchAssignedUsers = async () => {
    // Dummy users
    setAssignedOptions([
      { label: "John Doe", value: "1" },
      { label: "Jane Smith", value: "2" },
      { label: "Admin", value: "3" },
    ]);
  };

  const fetchReminders = async () => {
    // Dummy reminders
    setReminders([
      { id: "1", date: "2025-11-08", title: "Follow-up Loan", assigned_to: "1", priority: "High", status: "Active" },
      { id: "2", date: "2025-11-09", title: "Send Statement", assigned_to: "2", priority: "Medium", status: "Inactive" },
    ]);
  };

  useEffect(() => {
    fetchAssignedUsers();
    fetchReminders();
  }, []);

  const handleFormSubmit: SubmitHandler<Reminder> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    if (!formData) return;
    if (editId) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editId ? { ...formData, id: editId, status: r.status || "Active" } : r))
      );
    } else {
      setReminders((prev) => [...prev, { ...formData, id: String(Date.now()), status: "Active" }]);
    }
    methods.reset({ date: "", title: "", description: "", assigned_to: "", priority: "Medium" });
    setEditId(null);
    setShowConfirm(false);
    setActiveTab("list");
  };

  const handleEdit = (item: Reminder) => {
    methods.reset(item);
    setEditId(item.id || null);
    setActiveTab("entry");
  };

  const handleToggleStatus = (item: Reminder) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r))
    );
  };

  return (
    <FormProvider {...methods}>
      <div className="px-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "entry"
                ? "border-b-2 border-[#103BB5] text-[#103BB5]"
                : "text-gray-500 hover:text-[#103BB5]"
            }`}
          >
            Add / Edit Reminder
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "list"
                ? "border-b-2 border-[#103BB5] text-[#103BB5]"
                : "text-gray-500 hover:text-[#103BB5]"
            }`}
          >
            Reminder List
          </button>
        </div>

        {/* Entry Tab */}
        {activeTab === "entry" && (
          <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="bg-white p-4 rounded space-y-4">
            <Row label="Date">
              <FormField name="date" type="datepicker" placeholder="Select date" />
            </Row>
            <Row label="Title">
              <FormField name="title" type="input" placeholder="Reminder title" />
            </Row>
            <Row label="Description">
              <textarea {...methods.register("description")} placeholder="Optional" className="border p-2 rounded w-full" />
            </Row>
            <Row label="Assigned To">
              <TypeaheadField name="assigned_to" options={assignedOptions} placeholder="Select user" />
            </Row>
            <Row label="Priority">
              <div className="flex gap-4">
                {["High", "Medium", "Low"].map((p) => (
                  <label key={p} className="flex items-center gap-1">
                    <input type="radio" {...methods.register("priority")} value={p} className="accent-[#103BB5]" />
                    {p}
                  </label>
                ))}
              </div>
            </Row>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#103BB5] text-white hover:bg-[#256b45]">
                {editId ? "Update" : "Add Reminder"}
              </Button>
            </div>
          </form>
        )}

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="table-default w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-center">#</th>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th className="text-center">Priority</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {reminders.length > 0 ? (
                  reminders.map((item, i) => (
                    <tr key={item.id} className="border-t">
                      <td className="text-center">{i + 1}</td>
                      <td>{item.date}</td>
                      <td>{item.title}</td>
                      <td>{assignedOptions.find((u) => u.value === item.assigned_to)?.label || "-"}</td>
                      <td className="text-center">{item.priority}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`relative inline-flex items-center h-4 w-8 rounded-full transition-colors duration-300 ${
                            item.status === "Active" ? "bg-[#103BB5]" : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`absolute left-0.5 top-0.5 h-3 w-3 bg-white rounded-full transition-transform duration-300 ${
                              item.status === "Active" ? "translate-x-4" : "translate-x-0"
                            }`}
                          ></span>
                        </button>
                      </td>
                      <td className="text-center">
                        <span className="cursor-pointer" onClick={() => handleEdit(item)}>
                          <PenIcon size={12} className="mr-2 inline-block text-[#103BB5]" />
                          Edit
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-gray-500">
                      No reminders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmModal
          open={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmSubmit}
          loading={loading}
          title="Confirm Reminder"
          message={editId ? "Update this reminder?" : "Add this reminder?"}
        />
      </div>
    </FormProvider>
  );
}
