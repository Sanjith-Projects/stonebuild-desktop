 "use client";

import { useForm, FormProvider, SubmitHandler, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { postRequest } from "../../utils/api";
import toast from "react-hot-toast";
import ConfirmModal from "../../utils/confirmationModal";
import { TypeaheadField } from "../../utils/typeheadField";
import { useEffect, useState } from "react";
import { PenIcon } from "lucide-react";

type Penalty = {
  from_days: string;
  to_days: string;
  penalty_type: "Fixed" | "Percentage";
  penalty_value: number;
};

type LoanScheme = {
  id?: string;
  scheme_name: string;
  jewel_type_id: string;
  loan_percentage: string;
  interest_rate: string;
  description?: string;
  status?: string;
  penalties: Penalty[];
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

export default function LoanSchemeForm() {
  const methods = useForm<LoanScheme>({
    defaultValues: {
      scheme_name: "",
      jewel_type_id: "",
      loan_percentage: "",
      interest_rate: "",
      description: "",
      penalties: [],
    },
  });

  const { control } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: "penalties" });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<LoanScheme | null>(null);
  const [loanSchemes, setLoanSchemes] = useState<LoanScheme[]>([]);
  const [jewelTypeOptions, setJewelTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");

  // ✅ Fetch Jewel Types — no description or status shown
  const fetchJewelTypes = async () => {
    try {
      const res = await postRequest({ token: "getJewelType" });
      if (res.success && Array.isArray(res.data)) {
        const opts = res.data.map((jt: any) => ({
          label: `${jt.jewel_type} (${jt.jewel_purity})`, // ✅ show name + purity
          value: String(jt.id), // ✅ store id
        }));
        setJewelTypeOptions(opts);
      }
    } catch {
      toast.error("Failed to load jewel types ❌");
    }
  };

  const fetchSchemes = async () => {
    try {
      const res = await postRequest({ token: "getLoanScheme" });
      if (res.success && Array.isArray(res.data)) setLoanSchemes(res.data);
    } catch {
      toast.error("Failed to load loan schemes ❌");
    }
  };

  useEffect(() => {
    fetchJewelTypes();
    fetchSchemes();
  }, []);

  const handleFormSubmit: SubmitHandler<LoanScheme> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

 const confirmSubmit = async () => {
  if (!formData) return;
  setLoading(true);
  try {
    const payload = {
      token: editId ? "updateLoanScheme" : "addLoanScheme",
      data: editId ? { ...formData, id: editId } : formData,
    };
    const res = await postRequest(payload);
    if (res.success) {
      toast.success(editId ? "Scheme updated ✅" : "Scheme added ✅");

      
      methods.reset({
        scheme_name: "",
        jewel_type_id: "",
        loan_percentage: "",
        interest_rate: "",
        description: "",
        penalties: [],
      });

      setEditId(null);
      fetchSchemes();
      setActiveTab("list");
    } else {
      toast.error(res.message || "Operation failed ❌");
    }
  } catch (err: any) {
    toast.error(err.message || "API error ❌");
  } finally {
    setShowConfirm(false);
    setLoading(false);
  }
};


  const handleEdit = async (item: LoanScheme) => {
    if (jewelTypeOptions.length === 0) {
      await fetchJewelTypes();
    }

    const transformed = {
      ...item,
      jewel_type_id: String(item.jewel_type_id),
      penalties: (item.penalties || []).map((p: any) => ({
        from_days: p.delay_days_from,
        to_days: p.delay_days_to,
        penalty_type: p.penalty_type,
        penalty_value: p.penalty_value,
      })),
    };

    methods.reset(transformed);
    setEditId(item.id || null);
    setActiveTab("entry");
  };

  const handleToggleStatus = async (item: LoanScheme) => {
    try {
      const newStatus = item.status === "Active" ? "Inactive" : "Active";
      const res = await postRequest({
        token: "updateLoanSchemeStatus",
        data: { id: item.id, status: newStatus },
      });
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchSchemes();
      } else toast.error("Failed to update status ❌");
    } catch {
      toast.error("API error ❌");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="px-6">
        {/* 🔹 Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "entry"
                ? "border-b-2 border-[#103BB5] text-[#103BB5]"
                : "text-gray-500 hover:text-[#103BB5]"
            }`}
          >
            Add / Edit Scheme
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "list"
                ? "border-b-2 border-[#103BB5] text-[#103BB5]"
                : "text-gray-500 hover:text-[#103BB5]"
            }`}
          >
            Loan Scheme List
          </button>
        </div>

        {/* 🔹 Entry Tab */}
        {activeTab === "entry" && (
          <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="bg-white space-y-6 px-50  ">
            <div className="space-y-4">
              <Row label="Scheme Name">
                <FormField name="scheme_name" type="input" placeholder="Enter Loan Scheme name" className=""  />
              </Row>

              {/* ✅ Jewel Type - shows label, stores ID */}
              <Row label="Jewel Type">
                <TypeaheadField
                  name="jewel_type_id"
                  options={jewelTypeOptions}
                  placeholder="Select jewel type"
                />
              </Row>
  <Row label="Loan Type">
            
                <TypeaheadField
                  name="loan_type"
                  options={[
                    { label: "Flat", value: "Flat" },
                    { label: "Reducing", value: "Reducing" },
                    { label: "Interest-Only", value: "Interest-Only" },
                  ]}
                  placeholder="Select Loan Type"
                />
              </Row>


              <Row label="Loan % of Jewel Worth">
                <FormField name="loan_percentage" type="input" placeholder="%" className="numbers-decimal" />
              </Row>

              <Row label="Monthly Interest Rate (%)">
                <FormField name="interest_rate" type="input" placeholder="%" className="numbers-decimal" />
              </Row>

              <Row label="Description">
                <textarea
                  {...methods.register("description")}
                  placeholder="Optional"
                  className="border p-2 rounded w-full"
                />
              </Row>
            </div>

            {/* 🔹 Penalties Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[#103BB5]">Penalty Rules</h3>
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      from_days: "",
                      to_days: "",
                      penalty_type: "Fixed",
                      penalty_value: 0,
                    })
                  }
                  className="bg-[#103BB5] text-white hover:bg-[#256b45]"
                >
                  + Add Penalty
                </Button>
              </div>

              {fields.length > 0 ? (
                 <div className="max-h-[calc(100vh-600px)] overflow-y-auto border rounded-lg">
    <table className="  table-default">
      <thead className=" sticky top-0 z-10">
                      <tr>
                        <th className="text-left">From Days</th>
                        <th className="text-left">To Days</th>
                        <th className="text-left">Penalty Type</th>
                        <th className="text-left">Penalty Value</th>
                        <th className="text-center w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr key={field.id} className="odd:bg-white even:bg-gray-50 border-t">
                          <td>
                            <FormField
                              name={`penalties.${index}.from_days`}
                              type="input"
                              placeholder="From"
                              className="only-numbers"
                            />
                          </td>
                          <td>
                            <FormField
                              name={`penalties.${index}.to_days`}
                              type="input"
                              placeholder="To"
                              className="only-numbers"
                            />
                          </td>
                          <td>
                            <FormField
                              name={`penalties.${index}.penalty_type`}
                              type="typeahead"
                              options={[
                                { label: "Fixed", value: "Fixed" },
                                { label: "Percentage", value: "Percentage" },
                              ]}
                            />
                          </td>
                          <td>
                            <FormField
                              name={`penalties.${index}.penalty_value`}
                              type="input"
                              placeholder="Value"
                              className="numbers-decimal"
                            />
                          </td>
                          <td className="text-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => remove(index)}
                              className="text-red-600 border-red-400 hover:bg-red-100"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No penalties added yet.</p>
              )}
            </div>

            <footer className="mt-8 border-t pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#103BB5] text-white hover:bg-[#256b45]"
              >
                {loading ? "Saving..." : editId ? "Update" : "Submit"}
              </Button>
            </footer>
          </form>
        )}

        {/* 🔹 List Tab */}
        {activeTab === "list" && (
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto border rounded-lg">
    <table className="  table-default">
      <thead className=" sticky top-0 z-10">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-left">Scheme Name</th>
                  <th className="text-center">Loan %</th>
                  <th className="text-center">Interest %</th>
                 
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loanSchemes.length > 0 ? (
                  loanSchemes.map((item, i) => (
                    <tr key={item.id}>
                      <td className="text-center">{i + 1}</td>
                      <td>{item.scheme_name}</td>
                      <td className="text-center">{item.loan_percentage}%</td>
                      <td className="text-center">{item.interest_rate}%</td>
                      

                      <td className="p-2 border text-center">
                        <span
                          className="cursor-pointer"
                          onClick={() => handleEdit(item)}
                        >
                          <PenIcon size={12} className="mr-2 inline-block text-[#103BB5]" />
                          Edit
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No loan schemes found.
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
          title="Confirm Submission"
          message={
            editId
              ? "Are you sure you want to update this loan scheme?"
              : "Are you sure you want to add this loan scheme?"
          }
        />
      </div>
    </FormProvider>
  );
}
