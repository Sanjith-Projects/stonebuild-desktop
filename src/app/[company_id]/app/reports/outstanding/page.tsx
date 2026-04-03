 "use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { postRequest } from "../../utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FilterForm = {
  from_date: string;
  to_date: string;
};

type Loan = {
  loan_id: string;
  scheme_id: string;
  loan_type: string;
  loan_category: string;
  loan_taken_amount: number;
  interest_percent: number;
  interest_per_month: number;
  application_date: string;
  status: string;
  principal_outstanding: number;
  interest_outstanding: number;
  total_outstanding: number;
  months_elapsed: number;
};

type ContactOutstanding = {
  contact_id: number;
  contact_name: string;
  total_principal: number;
  total_interest: number;
  total_outstanding: number;
  loans: Loan[];
};

type StatementEntry = {
  id: number;
  date: string;
  loan_id: string;
  loan_category: string;
  transaction_type: string;
  account_id: string;
  mode: string;
  amount: number;
  remarks: string;
  status: string;
};

export default function OutstandingPage() {
  const methods = useForm<FilterForm>({
    defaultValues: {
      from_date: "",
      to_date: "",
    },
  });

  const [outstanding, setOutstanding] = useState<ContactOutstanding[]>([]);
  const [filteredOutstanding, setFilteredOutstanding] = useState<ContactOutstanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactOutstanding | null>(null);
  const [statementData, setStatementData] = useState<StatementEntry[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const res = await postRequest({ token: "outstanding" });
      const list: ContactOutstanding[] = Array.isArray(res?.data) ? res.data : [];
      setOutstanding(list);
      setFilteredOutstanding(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstanding();
  }, []);

  useEffect(() => {
    if (showOverdueOnly) {
      const filtered = outstanding.map((contact) => {
        const overdueLoans = contact.loans.filter(
          (loan) => loan.total_outstanding > loan.interest_per_month
        );
        if (overdueLoans.length === 0) return null;

        const totalOverdue = overdueLoans.reduce(
          (sum, loan) => sum + loan.total_outstanding,
          0
        );
        return {
          ...contact,
          loans: overdueLoans,
          total_outstanding: totalOverdue,
        };
      }).filter(Boolean) as ContactOutstanding[];
      setFilteredOutstanding(filtered);
    } else {
      setFilteredOutstanding(outstanding);
    }
  }, [showOverdueOnly, outstanding]);

  const totalAllOutstanding = filteredOutstanding.reduce(
    (sum, contact) => sum + contact.total_outstanding,
    0
  );

  const totalOverdueOutstanding = filteredOutstanding.reduce((sum, contact) => {
    const overdue = contact.loans
      .filter((loan) => loan.total_outstanding > loan.interest_per_month)
      .reduce((s, loan) => s + loan.total_outstanding, 0);
    return sum + overdue;
  }, 0);

  const handleRowClick = (contact: ContactOutstanding) => {
    setSelectedContact(contact);
    setStatementOpen(true);
    methods.reset({ from_date: "", to_date: "" });
    setStatementData([]);
  };

  const handleGetStatement = async () => {
    if (!selectedContact) return;
    
    const data = methods.getValues();
    setStatementLoading(true);
    try {
      const payload = {
        token: "customer_statement",
        contact_id: selectedContact.contact_id,
        from_date: data.from_date,
        to_date: data.to_date,
      };
      const res = await postRequest(payload);
      if (res.success) {
        setStatementData(res.data || []);
      }
    } finally {
      setStatementLoading(false);
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center gap-4">
        <span className="font-medium text-gray-700">Filter:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="filter"
            checked={!showOverdueOnly}
            onChange={() => setShowOverdueOnly(false)}
            className="cursor-pointer"
          />
          <span>Show All</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="filter"
            checked={showOverdueOnly}
            onChange={() => setShowOverdueOnly(true)}
            className="cursor-pointer"
          />
          <span>Show Only Overdue (Outstanding &gt; 1 Month Interest)</span>
        </label>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="table-default w-full">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="text-center">S.No</th>
              <th>Contact Name</th>
              <th>Contact ID</th>
              <th>Loan Count</th>
              <th className="text-right">Total Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : filteredOutstanding.length > 0 ? (
              filteredOutstanding.map((contact, index) => (
                <tr
                  key={contact.contact_id}
                  className="border-t hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleRowClick(contact)}
                >
                  <td className="text-center">{index + 1}</td>
                  <td>{contact.contact_name}</td>
                  <td>{contact.contact_id}</td>
                  <td>{contact.loans.length}</td>
                  <td className="text-right font-semibold">
                    ₹{contact.total_outstanding.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No outstanding found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-100 font-bold">
            <tr>
              <td colSpan={4} className="text-right px-4 py-2">
                Total Outstanding (All):
              </td>
              <td className="text-right">₹{totalAllOutstanding.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right px-4 py-2">
                Total Outstanding (Overdue &gt; 1 Month):
              </td>
              <td className="text-right">₹{totalOverdueOutstanding.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent className="w-full min-w-[1300px] max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>
              Statement for {selectedContact?.contact_name} (ID: {selectedContact?.contact_id})
            </DialogTitle>
          </DialogHeader>

          {/* <FormProvider {...methods}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField name="from_date" type="datepicker" placeholder="From date" />
                <FormField name="to_date" type="datepicker" placeholder="To date" />
              </div>
              <Button
                onClick={handleGetStatement}
                className="bg-[#103BB5] text-white hover:bg-[#256b45]"
                disabled={statementLoading}
              >
                {statementLoading ? "Loading..." : "Get Statement"}
              </Button>
            </div>
          </FormProvider> */}

          {selectedContact && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Loans ({selectedContact.loans.length})</h3>
              <div className="border rounded overflow-x-auto">
                <table className="table-default w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Loan ID</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th className="text-right">Principal</th>
                      <th className="text-right">Interest</th>
                      <th className="text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContact.loans.map((loan) => (
                      <tr key={loan.loan_id} className="border-t">
                        <td>{loan.loan_id}</td>
                        <td>{loan.loan_category}</td>
                        <td>{loan.loan_type}</td>
                        <td>{loan.application_date}</td>
                        <td className="text-right">₹{loan.principal_outstanding.toFixed(2)}</td>
                        <td className="text-right">₹{loan.interest_outstanding.toFixed(2)}</td>
                        <td className="text-right font-semibold">
                          ₹{loan.total_outstanding.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {statementData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Transactions</h3>
              <div className="border rounded overflow-x-auto">
                <table className="table-default w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Date</th>
                      <th>Loan ID</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Account</th>
                      <th>Mode</th>
                      <th className="text-right">Amount</th>
                      <th>Remarks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((entry, idx) => (
                      <tr
                        key={`${entry.transaction_type}-${entry.id}`}
                        className={`border-t ${
                          entry.transaction_type === "Payment" ? "bg-green-50" : "bg-blue-50"
                        }`}
                      >
                        <td>{entry.date}</td>
                        <td>{entry.loan_id}</td>
                        <td>{entry.loan_category}</td>
                        <td className="font-semibold">{entry.transaction_type}</td>
                        <td>{entry.account_id}</td>
                        <td>{entry.mode}</td>
                        <td className="text-right">₹{entry.amount.toFixed(2)}</td>
                        <td>{entry.remarks}</td>
                        <td>{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}