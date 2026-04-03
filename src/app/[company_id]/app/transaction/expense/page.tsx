     "use client";

import { useForm, FormProvider, SubmitHandler, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { TypeaheadField } from "../../utils/typeheadField";
import toast from "react-hot-toast";
import ConfirmModal from "../../utils/confirmationModal";
import { PenIcon } from "lucide-react";
import { postRequest } from "../../utils/api";
import { format } from "date-fns";             // <-- add this

type Expense = {
  id?: string;
 date: string;
  expense_category_id: string;
  bank_account_id: string;
  mode: "Cash" | "Cheque" | "UPI" | "NEFT";
  amount: string;
  description?: string;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
    <div className="w-2/3">{children}</div>
  </div>
);

export default function ExpensePage() {

    const todayStr = format(new Date(), "dd/MM/yyyy"); 
  
  const methods = useForm<Expense>({
    defaultValues: {
      
       date: todayStr, 
      expense_category_id: "",
      bank_account_id: "",
      mode: "Cash",
      amount: "",
      description: "",
    },
  });

  const { control } = methods;
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");

  // Dummy fetches
  const fetchCategories = async () => {
    
  try {
    const payload = { 
      token: "getLedgerType",
      data: { ledger_type: "expense_ledger" }  
    };
    const res = await postRequest(payload);
    if (res.success && Array.isArray(res.data)) {
        const opts = res.data.map((ledgerType: any) => ({
          label: `${ledgerType.ledger_name}`,  
          value: String(ledgerType.id),  
        }));
        setCategoryOptions(opts);
    } else {
      setCategoryOptions([]);
     
    }
  } catch {
    toast.error("Failed to load ledger types ❌");
  }





  };

  const fetchBanks = async () => {
    
  try {
    const payload = { 
      token: "getLedgerType",
      data: { ledger_type: "accounts_ledger" }  
    };
    const res = await postRequest(payload);
    if (res.success && Array.isArray(res.data)) {
        const opts = res.data.map((ledgerType: any) => ({
          label: `${ledgerType.ledger_name}`, 
          value: String(ledgerType.id),  
        }));
        setBankOptions(opts);
    } else {
      setBankOptions([]);
     
    }
  } catch {
    toast.error("Failed to load ledger types ❌");
  }

  };

  const fetchExpenses = async () => {
      try {
    const payload = { 
      token: "getExpense",
     };
    const res = await postRequest(payload);
    if (res.success) {
        const opts = res.data 
        setExpenses(opts);
    } else {
      setExpenses([]);
     
    }
  } catch {
    toast.error("Failed to load ledger types ❌");
  }
  };

  useEffect(() => {
    fetchCategories();
    fetchBanks();
    fetchExpenses();
  }, []);

  const handleFormSubmit: SubmitHandler<Expense> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const payload = {
        token: editId ? "updateExpense" : "addExpense",
        data: editId ? { ...formData, id: editId } : formData,
      };
      console.log("API Payload:", payload); // dummy api
     const res = await postRequest(payload);
      if (res.success) {
          toast.success("Expense saved ✅");
      methods.reset({
        date: todayStr,
        expense_category_id: "",
        bank_account_id: "",
        mode: "Cash",
        amount: "",
        description: "",
      });
      setEditId(null);
      fetchExpenses();
      setActiveTab("list");

    } 
      else {
       toast.error(res.message || "API error ❌");
      }
    } catch (error) {
      toast.error("Submission failed ❌");
    }
    finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleEdit = (item: Expense) => {
    methods.reset(item);
    setEditId(item.id || null);
    setActiveTab("entry");
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
            Add / Edit Expense
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "list"
                ? "border-b-2 border-[#103BB5] text-[#103BB5]"
                : "text-gray-500 hover:text-[#103BB5]"
            }`}
          >
            Expense List
          </button>
        </div>

        {/* Entry Tab */}
        {activeTab === "entry" && (
          <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="bg-white space-y-6  px-50">
            <div className="space-y-4">
              <Row label="Date">
               
                   <FormField type="datepicker" name="date" />
              </Row>

              <Row label="Expense Category">
                <TypeaheadField name="expense_category_id" options={categoryOptions} placeholder="Select category" />
              </Row>

              <Row label="Bank Account">
                <TypeaheadField name="bank_account_id" options={bankOptions} placeholder="Select bank account" />
              </Row>

              <Row label="Mode">
                <div className="flex gap-4">
                  {["Cash", "Cheque", "UPI", "NEFT"].map((mode) => (
                    <label key={mode} className="flex items-center gap-1">
                      <input
                        type="radio"
                        value={mode}
                        {...methods.register("mode")}
                        className="accent-[#103BB5]"
                      />
                      {mode}
                    </label>
                  ))}
                </div>
              </Row>

              <Row label="Amount">
                <FormField name="amount" type="input" placeholder="Enter amount" className="numbers-decimal" />
              </Row>

              <Row label="Description">
                <textarea
                  {...methods.register("description")}
                  placeholder="Optional"
                  className="border p-2 rounded w-full"
                />
              </Row>
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

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto border rounded-lg">
            <table className="table-default w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Bank</th>
                  <th className="text-center">Mode</th>
                  <th className="text-center">Amount</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((item, i) => (
                    <tr key={item.id} className="border-t">
                      <td className="text-center">{i + 1}</td>
                      <td>{item.date}</td>
                      <td>{categoryOptions.find((c) => c.value === item.expense_category_id)?.label}</td>
                      <td>{bankOptions.find((b) => b.value === item.bank_account_id)?.label}</td>
                      <td className="text-center">{item.mode}</td>
                      <td className="text-center">{item.amount}</td>
                      <td className="text-center">
                        <span
                          className="cursor-pointer flex items-center justify-center gap-1"
                          onClick={() => handleEdit(item)}
                        >
                          <PenIcon size={12} className="text-[#103BB5]" />
                          Edit
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-gray-500">
                      No expenses found.
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
          message={editId ? "Update this expense?" : "Add this expense?"}
        />
      </div>
    </FormProvider>
  );
}
