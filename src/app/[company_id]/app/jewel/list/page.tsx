 "use client";
import { useEffect, useState, useCallback } from "react";
import { postRequest } from "../../utils/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Eye, Filter, Pencil, Pen as PenIcon } from "lucide-react";
import Sidebar from "../../utils/sidebar";
import Modal from "../../utils/generalModal";
// New imports for transaction form
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { FormField } from "../../utils/formField";
import { TypeaheadField } from "../../utils/typeheadField";
import ConfirmModal from "../../utils/confirmationModal";
import { format } from "date-fns";    
type Loan = {
  id: string;
  contact_name: string;
  loan_id:string;
  scheme_name: string;
  loan_taken_amount: number;
  loan_available_amount: number;
  rate_per_gram: number;
  application_date: string;
  interest_percent :string;
  status: "applied" | "approved" | "rejected" | "closed";
};
type Jewel = {
  jewel_type: string;
  jewel_name: string;
  total_gms: string;
  jewel_purity: string;
  jewel_description: string;
};
type LoanDetails = Loan & {
  jewels?: Jewel[];
};
type StatusUpdateState = {
  newStatus: "" | "applied" | "approved" | "rejected";
  jewelleryReceived: boolean;
};
// Transaction form types
type TransactionForm = {
  date: string;
  transaction_type: "received" | "given";
  account_id: string;
  amount: string;
  mode: "Cash" | "Cheque" | "UPI" | "NEFT";
  remarks?: string;
};
export default function LoanList() {
  const [loanList, setLoanList] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schemeOptions, setSchemeOptions] = useState<
    { label: string; value: string; loan_percentage: number; interest_rate: number }[]
  >([]);
  // Status Update states
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [loanToUpdate, setLoanToUpdate] = useState<Loan | null>(null);
  const [updateState, setUpdateState] = useState<StatusUpdateState>({
    newStatus: "" as any,
    jewelleryReceived: false,
  });
  // New: Update (transaction) modal states
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [transactionLoan, setTransactionLoan] = useState<Loan | null>(null);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // list structure to be defined later
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
    const [contactOptions, setContactOptions] = useState<{ label: string; value: string }[]>([]);
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
    <div className="w-2/3">{children}</div>
  </div>
);
    const todayStr = format(new Date(), "dd/MM/yyyy"); 
// --- Add these near your hooks (after todayStr) ---
const filterMethods = useForm({
  defaultValues: {
    contact_id: "",
    scheme_id: "",
    "from-date": todayStr,   // default to today
    "to-date": todayStr,     // default to today
    "min-amount": "",
    "max-amount": "",
  },
});

const { getValues: getFilterValues, reset: resetFilter } = filterMethods;

const applyFilter = async () => {
  const values = getFilterValues();
  // build payload data exactly as server expects
  const dataPayload: any = {
    contact_id: values["contact_id"] || undefined,
    scheme_id: values["scheme_id"] || undefined,
    from_date: values["from-date"] || undefined,
    to_date: values["to-date"] || undefined,
    min_amount: values["min-amount"] || undefined,
    max_amount: values["max-amount"] || undefined,
  };

  // remove undefined keys so payload is clean
  Object.keys(dataPayload).forEach((k) => dataPayload[k] === undefined && delete dataPayload[k]);

  setFilterOpen(false);
  setLoading(true);
  try {
    const res = await postRequest({ token: "getJewelLoan", data: dataPayload });
    if (res.success && Array.isArray(res.data)) {
      setLoanList(res.data);
      toast.success("Filter applied");
    } else {
      setLoanList([]);
      toast("No loans matched the filter", { icon: "ℹ️" });
    }
  } catch (err) {
    console.error("Filter error:", err);
    toast.error("Failed to apply filter ❌");
  } finally {
    setLoading(false);
  }
};

// optional: to reset filter form
const clearFilter = () => {
  resetFilter({
    contact_id: "",
    scheme_id: "",
    "from-date": todayStr,
    "to-date": todayStr,
    "min-amount": "",
    "max-amount": "",
  });
  // and optionally reload all loans
  fetchLoans();
};

  const methods = useForm<TransactionForm>({
    defaultValues: {
      date: todayStr,
      transaction_type: "received",
      account_id: "",
      amount: "",
      mode: "Cash",
      remarks: "",
    },
  });
 const { watch, setValue } = methods; 
  const { handleSubmit, reset } = methods;
  const fetchSchemes = async () => {
    const res = await postRequest({ token: "getLoanScheme" });
    if (res.success) {
      setSchemeOptions(
        res.data.map((s: any) => ({
          label: s.scheme_name,
          value: s.id,
          loan_percentage: s.loan_percentage,
          interest_rate: s.interest_rate || 12,
        }))
      );
    }
  };
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await postRequest({ token: "getJewelLoan" });
      if (res.success && Array.isArray(res.data)) {
        setLoanList(res.data);
      } else {
        setLoanList([]);
      }
    } catch {
      toast.error("Failed to fetch loans ❌");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoans();
    fetchAccountOptions();
    fetchSchemes();
     fetchContacts();
  }, []);
  const fetchAccountOptions = async () => {
    try {
      const payload = {
        token: "getLedgerType",
        data: { ledger_type: "accounts_ledger" },
      };
      const res = await postRequest(payload);
      if (res.success && Array.isArray(res.data)) {
        const opts = res.data.map((ledgerType: any) => ({
          label: `${ledgerType.ledger_name}`,
          value: String(ledgerType.id),
        }));
        setAccountOptions(opts);
      } else setAccountOptions([]);
    } catch {
      toast.error("Failed to load accounts ❌");
    }
  };
  const fetchContacts = async () => {
    const res = await postRequest({ token: "getContacts" });
    if (res.success) {
      setContactOptions(res.data.map((c: any) => ({ label: c.full_name, value: c.id })));
    }
  };
  const fetchLoanDetails = async (loan: Loan) => {
    setDetailsLoading(true);
    setSelectedLoan({ ...loan, jewels: [] });
    try {
      const res = await postRequest({ token: "getJewelDetails", data: { loan_id: loan.id } });
      if (res.success && Array.isArray(res.data)) {
        setSelectedLoan({
          ...loan,
          jewels: res.data,
        });
        setViewOpen(true);
      } else {
        setSelectedLoan({ ...loan, jewels: [] });
        setViewOpen(true);
        toast("No jewel details found for this loan", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Failed to fetch loan details ❌");
      setSelectedLoan(null);
    } finally {
      setDetailsLoading(false);
    }
  };
  // Status update modal functions
  const openStatusUpdateModal = (loan: Loan) => {
    setLoanToUpdate(loan);
    setStatusUpdateOpen(true);
  };
  const handleStatusUpdate = async () => {
    if (!loanToUpdate) return;
    const { newStatus, jewelleryReceived } = updateState;
    if (newStatus === "approved" && !jewelleryReceived) {
      toast.error("Please confirm that the customer has received the jewellery.");
      return;
    }
    const payload = {
      loan_id: loanToUpdate.id,
      status: newStatus,
    };
    setDetailsLoading(true);
    try {
      const res = await postRequest({ token: "updateJewelLoanStatus", data: payload });
      if (res.success) {
        setLoanList((prevList) =>
          prevList.map((loan) => (loan.id === loanToUpdate.id ? { ...loan, status: newStatus as Loan["status"] } : loan))
        );
        toast.success(`Loan ${loanToUpdate.id} status successfully updated to: ${newStatus}!`);
        setStatusUpdateOpen(false);
        setLoanToUpdate(null);
      } else {
        toast.error(res.message || "Failed to update loan status on the server ❌");
      }
    } catch (error) {
      toast.error("An error occurred during the status update API call ❌");
      console.error("Status update error:", error);
    } finally {
      setDetailsLoading(false);
    }
  };
 const openUpdateModal = (loan: Loan) => {
  setTransactionLoan(loan);
  setUpdateModalOpen(true);
  setActiveTab('entry');

   const idToFetch = String(loan.loan_id);
   
 
  reset({
    date: todayStr,
    transaction_type: "received",
    account_id: "",
    amount: "",
    mode: "Cash",
    remarks: "",
  });
};

const fetchTransactions = async (id: string) => {
  
  try {
    // log payload before sending
    const payload = { loan_id: id };
   
    const res = await postRequest({ token: "getLoanTransactions", data: payload });

  
    if (res.success && Array.isArray(res.data)) {
      setTransactions(res.data);
    } else {
      setTransactions([]);
    }
  } catch (e) {
    console.warn("Could not fetch transactions", e);
    setTransactions([]);
  }
};

  useEffect(() => {
   
    if (updateModalOpen && transactionLoan && activeTab === "list") {
      fetchTransactions(transactionLoan.loan_id);
    }
  }, [updateModalOpen, transactionLoan, activeTab]);
  const onSubmit: SubmitHandler<TransactionForm> = (data) => {
    // open confirm modal
    methods.setValue("amount", data.amount);
    setConfirmOpen(true);
  };
  const confirmTransaction = async () => {
    if (!transactionLoan) return;
    const data = methods.getValues();
    setFormLoading(true);
    try {
      const payload = {
        token: "addLoanTransaction",
        data: {
          loan_id: transactionLoan.loan_id,
          ...data,
        },
      };
      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Transaction saved ✅");
        reset();
        setActiveTab("list");
        fetchTransactions(transactionLoan.id);
        setConfirmOpen(false);
      } else {
        toast.error(res.message || "Failed to save transaction ❌");
      }
    } catch (e) {
      toast.error("Submission failed ❌");
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };
  // Print handler (unchanged)
  const handlePrint = useCallback(() => {
    const content = document.getElementById("printArea")?.outerHTML;
    const originalBody = document.body.innerHTML;
    if (content) {
      document.body.innerHTML = content;
      window.print();
      document.body.innerHTML = originalBody;
      window.location.reload();
    } else {
      window.print();
    }
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (viewOpen) handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewOpen, handlePrint]);
  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={fetchLoans} className="bg-[#103BB5] text-white hover:bg-[#256b45]" disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </Button>
        <Button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border">
          <Filter size={16} />
          Filter
        </Button>
      </div>
      {/* Loan Table with extra Update column */}
      <div className="max-h-[calc(100vh-170px)] overflow-y-auto border rounded-lg">
        <table className="table-default w-full">
          <thead>
            <tr><th></th>
             <th className="text-center">Date</th>
              <th className="text-center">Loan ID</th>
              <th>Customer</th>
              <th>Scheme</th>
               <th className="text-right">Rate/gm (₹)</th>
             <th className="text-right">Loan Amount (₹)</th>
               <th className="text-right">Interest</th>
              <th className="text-center">Status</th>
              <th className="text-center">Action</th>
              <th className="text-center">Update</th> 
            </tr>
          </thead>
          <tbody>
            {loanList.length > 0 ? (
              loanList.map((loan, index) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
                  <td className="text-center">{index + 1}</td>
                   <td className="text-center">{loan.loan_id}</td>
                 <td className="text-center">{loan.application_date}</td>
                  <td>{loan.contact_name}</td>
                  <td>{loan.scheme_name}</td>
                  <td className="text-right">₹{loan.rate_per_gram}</td>
                  <td className="text-right">₹{Number(loan.loan_taken_amount).toLocaleString("en-IN")}</td>
                 <td className="text-right"> {loan.interest_percent} %</td>
                  <td className="text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      loan.status === "applied"
                        ? "bg-blue-100 text-blue-700"
                        : loan.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : loan.status === "closed"
                        ? "bg-gray-100 text-gray-700"
                        : loan.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center gap-2">
                      {loan.status === "applied" ? (
                        <>
                          <Pencil size={16} className="text-green-500 cursor-pointer hover:text-green-700" onClick={() => openStatusUpdateModal(loan)} />
                          <Eye size={16} className="text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => fetchLoanDetails(loan)} />
                        </>
                      ) : loan.status === "approved" ? (
                        <Eye size={16} className="text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => fetchLoanDetails(loan)} />
                      ) : null}
                    </div>
                  </td>
                  {/* NEW Update column cell */}
                  <td className="text-center">
                    <Button size="sm" variant="ghost" onClick={() => openUpdateModal(loan)} className="flex items-center gap-2">
                      <PenIcon size={14} /> Update
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500 italic">
                  No loans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    

 

<Sidebar
  open={filterOpen}
  title="Filter Loans"
  onClose={() => setFilterOpen(false)}
  footer={
    <>
      <Button variant="outline" onClick={() => { clearFilter(); setFilterOpen(false); }}>
        Reset
      </Button>
      <Button className="bg-[#103BB5] text-white hover:bg-[#256b45]" onClick={applyFilter}>
        Apply Filter
      </Button>
    </>
  }
>
  <div className="space-y-4">
    <FormProvider {...filterMethods}>
      <label className="block mb-2 font-medium text-gray-700 text-[17px]">Select Contact</label>
      <TypeaheadField
        name="contact_id"
        options={contactOptions}
        placeholder="Search and select contact..."
        onChange={() => {}}
      />

      <label className="block mb-2 font-medium text-gray-700 text-[17px]">Select Scheme</label>
      <TypeaheadField
        name="scheme_id"
        options={schemeOptions}
        placeholder="Select loan scheme..."
      />

      <label className="block mb-2 font-medium text-gray-700 text-[17px]">From Date</label>
      <FormField type="datepicker" name="from-date" />

      <label className="block mb-2 font-medium text-gray-700 text-[17px]">To Date</label>
      <FormField type="datepicker" name="to-date" />

      <label className="block mb-2 font-medium text-gray-700 text-[17px]">Min Amount</label>
      <FormField type="input" className="numbers-decimal" name="min-amount" />

      <label className="block mb-2 font-medium text-gray-700 text-[17px]">Max Amount</label>
      <FormField type="input" className="numbers-decimal" name="max-amount" />
    </FormProvider>
  </div>
</Sidebar>




      {/* View Modal (unchanged) */}
      <Modal
        open={viewOpen}
        title="Loan Details"
        onClose={() => setViewOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button className="bg-[#103BB5] text-white hover:bg-[#256b45]" onClick={handlePrint}>
              Print
            </Button>
          </>
        }
      >
        {detailsLoading ? (
          <p className="text-center text-gray-500 py-4">Loading details...</p>
        ) : selectedLoan ? (
          <div id="printArea" className="space-y-6 text-sm text-gray-800 print:p-8 print:bg-white p-5">
            {/* ... same loan details content ... */}
            <div className="text-center border-b pb-3">
              <h2 className="text-2xl font-bold text-[#103BB5]">ANJANEYA JEWELLERY </h2>
              <p className="text-gray-600 text-sm">37, Bazaar St, Namakkal, Tamil Nadu 637001</p>
              <p className="text-gray-600 text-sm">GSTIN: 33AABCG1234F1Z9</p>
              <p className="text-gray-500 text-xs mt-1">Phone: +91 98439 61234 | Email: info@anjaneyajewellery.in</p>
            </div>
            <div className="text-center mt-2">
              <h3 className="text-lg font-semibold underline">Jewel Loan Receipt</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50">
              <div>
                <p className="font-semibold text-gray-600">Customer</p>
                <p>{selectedLoan.contact_name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Scheme</p>
                <p>{selectedLoan.scheme_name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Loan Amount</p>
                <p>₹{Number(selectedLoan.loan_taken_amount).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Rate per Gram</p>
                <p>₹{selectedLoan.rate_per_gram}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Application Date</p>
                <p>{selectedLoan.application_date}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedLoan.status === "applied"
                    ? "bg-blue-100 text-blue-700"
                    : selectedLoan.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : selectedLoan.status === "closed"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {selectedLoan.status}
                </span>
              </div>
            </div>
            {selectedLoan.jewels && selectedLoan.jewels.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-2">Jewel Details</h3>
                <table className="w-full border text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="border px-2 py-1 text-left">Type</th>
                      <th className="border px-2 py-1 text-left">Name</th>
                      <th className="border px-2 py-1 text-right">Total Gms</th>
                      <th className="border px-2 py-1 text-right">Purity</th>
                      <th className="border px-2 py-1 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLoan.jewels.map((jewel, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{jewel.jewel_type}</td>
                        <td className="border px-2 py-1">{jewel.jewel_name}</td>
                        <td className="border px-2 py-1 text-right">{jewel.total_gms}</td>
                        <td className="border px-2 py-1 text-right">{jewel.jewel_purity}</td>
                        <td className="border px-2 py-1">{jewel.jewel_description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <div className="border-t border-gray-400 w-1/3 text-right pt-2">
                <p className="font-semibold">Total Loan Amount: ₹{Number(selectedLoan.loan_taken_amount).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="mt-6 border-t pt-4 text-xs text-gray-600 leading-relaxed">
              <h4 className="font-semibold mb-2">Terms & Conditions</h4>
              <ul className="list-disc ml-4 space-y-1">
                <li>The pledged jewels will remain the property of ANJANEYA JEWELLERY  until the loan is repaid.</li>
                <li>The borrower must settle the loan with applicable interest within the agreed tenure.</li>
                <li>In case of default, the company reserves the right to auction the pledged jewels.</li>
                <li>Interest will be calculated on a monthly basis at the agreed rate.</li>
                <li>All disputes are subject to <strong>Namakkal</strong> jurisdiction.</li>
              </ul>
            </div>
            <div className="mt-8 flex justify-between text-sm">
              <div>
                <p className="font-semibold">Customer Signature</p>
                <div className="h-10 border-b border-gray-400 w-48"></div>
              </div>
              <div className="text-right">
                <p className="font-semibold">For ANJANEYA JEWELLERY </p>
                <div className="h-10 border-b border-gray-400 w-48 ml-auto"></div>
                <p className="text-gray-500 text-xs">Authorized Signatory</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No details available</p>
        )}
      </Modal>
      {/* Status Update Modal (unchanged) */}
      <Modal
        open={statusUpdateOpen}
        title={`Update Status for Loan: ${loanToUpdate?.loan_id}`}
        onClose={() => setStatusUpdateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#103BB5] text-white hover:bg-[#256b45]" onClick={handleStatusUpdate} disabled={updateState.newStatus === "approved" && !updateState.jewelleryReceived}>
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-4 px-4">
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-1">Select New Status</label>
            <select value={updateState.newStatus} onChange={(e) => setUpdateState({ ...updateState, newStatus: e.target.value as StatusUpdateState["newStatus"], jewelleryReceived: false })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md border">
              <option value="">-- Select Status --</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
          {updateState.newStatus === "approved" && (
            <div className="flex items-center pt-2">
              <input id="jewellery-received" name="jewellery-received" type="checkbox" checked={updateState.jewelleryReceived} onChange={(e) => setUpdateState({ ...updateState, jewelleryReceived: e.target.checked })} className="h-4 w-4 text-[#103BB5] border-gray-300 rounded focus:ring-green-500" />
              <label htmlFor="jewellery-received" className="ml-2 block text-[16px] text-gray-900 font-medium">Confirm: Customer has received the loan amount and returned the jewellery (if applicable).</label>
            </div>
          )}
          <div className="pt-2 text-[16px] text-gray-600">Current Status: <span className="font-semibold">{loanToUpdate?.status}</span></div>
        </div>
      </Modal>
      {/* NEW: Update (Transaction) Modal */}
      <Modal
        open={updateModalOpen}
        title={`Transactions -   ${transactionLoan?.loan_id ?? ""}`}
        onClose={() => setUpdateModalOpen(false)}
        footer={null}
      >
        <FormProvider {...methods}>
          <div className='' style={{ height: 'calc(100vh - 10px)', width: '900px', maxWidth: '100%', overflow: 'auto' }}>
            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-4">
              <button onClick={() => setActiveTab("entry")} className={`px-6 py-3 font-medium transition-all ${activeTab === "entry" ? "border-b-2 border-[#103BB5] text-[#103BB5]" : "text-gray-500 hover:text-[#103BB5]"}`}>
                New Entry
              </button>
              <button onClick={() => setActiveTab("list")} className={`px-6 py-3 font-medium transition-all ${activeTab === "list" ? "border-b-2 border-[#103BB5] text-[#103BB5]" : "text-gray-500 hover:text-[#103BB5]"}`}>
                Entry List
              </button>
            </div>
            {/* Entry Tab */}
            {activeTab === "entry" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
  <div className="space-y-4">

  {/* Date */}
  <div className="grid grid-cols-2 gap-4 items-center">
    <div className="font-medium">Date</div>
    <FormField type="datepicker" name="date" />
  </div>

  {/* Transaction Type */}
  <div className="grid grid-cols-2 gap-4 items-center">
    <div className="font-medium">Transaction Type</div>
    <div className="flex gap-4">
      {(['received', 'given'] as const).map((t) => (
        <label key={t} className="flex items-center gap-2">
          <input
            type="radio"
            value={t}
            {...methods.register('transaction_type')}
            className="accent-[#103BB5]"
          />
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </label>
      ))}
    </div>
  </div>

  {/* Account */}
  <div className="grid grid-cols-2 gap-4 items-center">
    <div className="font-medium">Account</div>
    <TypeaheadField
      name="account_id"
      options={accountOptions}
      placeholder="Select account"
    />
  </div>

  {/* Amount */}
  <div className="grid grid-cols-2 gap-4 items-center">
    <div className="font-medium">Amount</div>
    <FormField
      name="amount"
      type="input"
      placeholder="Enter amount"
      className="numbers-decimal"
    />
  </div>

  {/* Mode */}
  <div className="grid grid-cols-2 gap-4 items-center">
    <div className="font-medium">Mode</div>
    <div className="flex gap-6">
      {(['Cash', 'UPI', 'NEFT', 'Cheque'] as const).map((m) => (
        <label key={m} className="flex items-center gap-2">
          <input
            type="radio"
            value={m}
            {...methods.register('mode')}
            className="accent-[#103BB5]"
          />
          {m}
        </label>
      ))}
    </div>
  </div>

  {/* Remarks */}
  <div className="grid grid-cols-1 gap-4">
    <div className="font-medium">Remarks</div>
    <textarea
      {...methods.register('remarks')}
      className="border p-2 rounded w-full"
      placeholder="Optional"
    />
  </div>

</div>

  <div className="flex justify-end gap-2 mt-4">
    <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
      Cancel
    </Button>
    <Button className="bg-[#103BB5] text-white hover:bg-[#256b45]" type="submit">
      Save
    </Button>
  </div>
</form>
            )}
            {/* List Tab - placeholder, will show fetched transactions when available */}
            {activeTab === "list" && (
              <div className="max-h-[calc(60vh)] overflow-y-auto   rounded-lg p-2">
                {transactions.length > 0 ? (
                  <table className="table-default w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Account</th>
                        <th className="text-right">Amount</th>
                        <th>Mode</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={i} className="border-t">
                          <td className="text-center">{i + 1}</td>
                          <td>{t.date}</td>
                          <td>{t.transaction_type}</td>
                          <td>{t.account_name || t.account_id}</td>
                          <td className="text-right">{t.amount}</td>
                          <td>{t.mode}</td>
                          <td>{t.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center p-6 text-gray-500">No transactions found.</div>
                )}
              </div>
            )}
            <ConfirmModal open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={confirmTransaction} loading={formLoading} title="Confirm Transaction" message="Save this transaction?" />
          </div>
        </FormProvider>
      </Modal>
    </div>
  );
}
