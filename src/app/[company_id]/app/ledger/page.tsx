 "use client";

import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";
import { PenIcon } from "lucide-react";

type LedgerType = {
  id?: string;
  ledger_type: string;
  ledger_name: string;
  status: string;
};

export default function LedgerTypeForm() {
  const methods = useForm<LedgerType>({
    defaultValues: {
      ledger_type: "",
      ledger_name: "",
      status: "1",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<LedgerType | null>(null);
  const [ledgerList, setLedgerList] = useState<LedgerType[]>([]);
  const [filteredList, setFilteredList] = useState<LedgerType[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedLedgerType, setSelectedLedgerType] = useState<string>("");

  const ledgerTypeOptions = [
    { label: "All Types", value: "" },
    { label: "Accounts Ledger", value: "accounts_ledger" },
    { label: "Expense Ledger", value: "expense_ledger" },
   { label: "Unit Ledger", value: "unit_ledger" },
      { label: "Contact Ledger", value: "contact_ledger" },

  
  ];

  // 🔹 Fetch list
  const fetchLedgerTypes = async () => {
    try {
      const payload = { token: "getLedgerType" };
      const res = await postRequest(payload);
      if (res.success && Array.isArray(res.data)) {
        setLedgerList(res.data);
        setFilteredList(res.data);
      } else {
        setLedgerList([]);
        setFilteredList([]);
      }
    } catch {
      toast.error("Failed to load ledger types ❌");
    }
  };

  useEffect(() => {
    fetchLedgerTypes();
  }, []);

  // 🔹 Filter by Ledger Type
  useEffect(() => {
    if (selectedLedgerType) {
      setFilteredList(
        ledgerList.filter((item) => item.ledger_type === selectedLedgerType)
      );
    } else {
      setFilteredList(ledgerList);
    }
  }, [selectedLedgerType, ledgerList]);

  // 🔹 Handle form submit
  const handleFormSubmit: SubmitHandler<LedgerType> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  // 🔹 Confirm submit
  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);

    try {
      const payload = {
        token: "updateLedgerType",
        data: editId ? { ...formData, id: editId } : formData,
      };

      const res = await postRequest(payload);
      if (res.success) {
        toast.success(editId ? "Updated successfully ✅" : "Added successfully ✅");
        methods.reset({ ledger_type: "", ledger_name: "", status: "1" });
        setEditId(null);
        fetchLedgerTypes();
      } else {
        toast.error(res.message || "Operation failed ❌");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // 🔹 Edit
  const handleEdit = (item: LedgerType) => {
    methods.reset({
      ledger_type: item.ledger_type,
      ledger_name: item.ledger_name,
      status: item.status,
    });
    setEditId(item.id || null);
  };

  const Row = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
      <div className="w-2/3">{children}</div>
    </div>
  );

  return (
    <FormProvider {...methods}>
      <div className="bg-white   ">
        <form
          onSubmit={methods.handleSubmit(handleFormSubmit)}
          className="flex flex-col pt-6 px-6  "
        >
          <div className="space-y-4  ">
            <Row label="Ledger Type">
              <FormField
                type="typeahead"
                name="ledger_type"
                placeholder="Select ledger type"
                options={ledgerTypeOptions.slice(1)} // exclude 'All Types' from form
                validation={{ required: "Ledger type is required" }}
              />
            </Row>

            <Row label="Ledger Name">
              <FormField
                type="input"
                name="ledger_name"
                placeholder="Enter ledger name"
                validation={{ required: "Ledger name is required" }}
              />
            </Row>

            <Row label="Status">
              <div className="flex gap-6">
                {[
                  { label: "Active", value: "1" },
                  { label: "Inactive", value: "0" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={opt.value}
                      {...methods.register("status")}
                      className="text-[#103BB5] focus:ring-[#103BB5]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </Row>
               <Row label="">
              <Button
              type="submit"
              disabled={loading}
              variant="default"
            >
              {loading ? "Saving..." : editId ? "Update" : "Submit"}
            </Button>
            </Row>


          </div>

         
        </form>

        {/* 🔹 Filter Section */}
        <div className="mt-5 px-6 flex items-center gap-4">
          <label className="font-medium text-gray-700">Filter by Type:</label>
          <select
            className="border rounded-md p-2 w-60"
            value={selectedLedgerType}
            onChange={(e) => setSelectedLedgerType(e.target.value)}
          >
            {ledgerTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

      <div className=" bg-white p-6">
 <div className="max-h-[calc(100vh-400px)] overflow-y-auto border rounded-lg">
    <table className="  table-default">
      <thead className=" sticky top-0 z-10">
        <tr>
          <th className="text-center  ">#</th>
          <th className="text-left  ">Ledger Type</th>
          <th className="text-left  ">Ledger Name</th>
          <th className="text-center  ">Status</th>
          <th className="text-center  ">Action</th>
        </tr>
      </thead>
      <tbody>
        {filteredList.length > 0 ? (
          filteredList.map((item, index) => (
            <tr
              key={item.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="text-center  ">{index + 1}</td>
              <td className=" ">
                {ledgerTypeOptions.find(
                  (opt) => opt.value === item.ledger_type
                )?.label || item.ledger_type}
              </td>
              <td className=" ">{item.ledger_name}</td>
              <td className="text-center  ">
                {item.status === "1" ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-red-500 font-medium">Inactive</span>
                )}
              </td>
              <td className="text-center  ">
                <span
                  className="cursor-pointer text-[#103BB5] hover:underline"
                  onClick={() => handleEdit(item)}
                >
                  <PenIcon size={12} className="inline-block mr-1" />
                  Edit
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={5}
              className="text-center p-4 text-gray-500"
            >
              No Ledger Types Found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      </div>

      {/* 🔹 Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message={
          editId
            ? "Are you sure you want to update this ledger type?"
            : "Are you sure you want to add this ledger type?"
        }
      />
    </FormProvider>
  );
}
