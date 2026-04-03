 "use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import toast from "react-hot-toast";
import { format } from "date-fns";             // <-- add this

type Option = { label: string; value: string };

type TransactionFormValues = {
  date: string;
  contact_id:string;
  mode: "cash" | "cheque" | "transfer";
  account_ledger_id: Option | null;
  amount: string;
  transaction_type: string;
};

type Transaction = {
  id: number;
  date: string;
  contact_name: string;
  mode: string;
  amount: string;
  account_name?: string;
  transaction_type?: string;
};

export default function TransactionsTab({ projectId, projectName }: any) {
  /* =========================
     ROW COMPONENT (YOURS)
  ========================= */
  const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <label className="w-1/3 font-medium text-gray-700 text-[15px]">
      {label}
    </label>

    {/* 👇 CRITICAL FIX */}
    <div className="w-2/3 relative z-50">
      {children}
    </div>
  </div>
);

  /* =========================
     FORM SETUP
  ========================= */
      const todayStr = format(new Date(), "dd/MM/yyyy"); 

  const methods = useForm<TransactionFormValues>({
    defaultValues: {
       date: todayStr, 
      contact_id: "",
      mode: "cash",
      account_ledger_id: null,
      amount: "",
      transaction_type:"received"
    },
  });

  const { watch, reset } = methods;
  const mode = watch("mode");

  /* =========================
     DROPDOWN DATA
  ========================= */
 const [isContactsLoading, setIsContactsLoading] = useState(true);
const [isAccountsLoading, setIsAccountsLoading] = useState(true);
const [contacts, setContacts] = useState<Option[]>([]);
const [accountLedgers, setAccountLedgers] = useState<Option[]>([]);

 const fetchProjectMembers = async () => {
  setIsContactsLoading(true);
  try {
    const res = await postRequest({
      token: "getProjectMembers",
      data: { project_id: projectId },
    });

    if (res.success) {
      const opts = res.data.map((m: any) => ({
        label: `${m.full_name} (${m.ledger_name || "Member"})`,
        value: String(m.contact_id),
      }));
      setContacts(opts);
    } else {
      setContacts([]);
    }
  } catch {
    toast.error("Failed to load project members ❌");
  } finally {
    setIsContactsLoading(false);
  }
};


   const fetchAccountLedgers = async () => {
  setIsAccountsLoading(true);
  try {
    const payload = {
      token: "getLedgerType",
      data: { ledger_type: "accounts_ledger" },
    };

    const res = await postRequest(payload);
    if (res && res.success && Array.isArray(res.data)) {
      const opts = res.data.map((a: any) => ({
        label: a.ledger_name ?? "",
        value: String(a.id ?? ""),
      }));
      setAccountLedgers(opts);
    } else {
      setAccountLedgers([]);
      toast.error("Accounts API returned no data.");
    }
  } catch (err) {
    setAccountLedgers([]);
    toast.error("Failed to load accounts ❌");
  } finally {
    setIsAccountsLoading(false);
  }
};

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      const payload = {
        token: "addTransaction",
        data: {
          project_id: projectId,
          date: data.date,
          contact_id: data.contact_id,
          mode: data.mode,
          account_ledger_id:  data.account_ledger_id,
          amount: data.amount,
          transaction_type: data.transaction_type,

        },
      };

      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Transaction added ✅");
        reset();
        fetchTransactions({ offset: 0, reset: true });
      } else toast.error(res.message || "Failed ❌");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌");
    }
  };

  /* =========================
     LIST (same tab)
  ========================= */
  const LIMIT = 10;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchTransactions = useCallback(
    async (opts: { offset?: number; reset?: boolean } = {}) => {
      const off = opts.offset ?? offset;
      const resetFlag = opts.reset ?? false;

      try {
        if (resetFlag) setLoading(true);

        const res = await postRequest({
          token: "getTransactions",
          data: { project_id: projectId, offset: off, limit: LIMIT },
        });

        if (res?.success && Array.isArray(res.data)) {
          setTransactions((prev) =>
            resetFlag ? res.data : [...prev, ...res.data]
          );
          setOffset(off + res.data.length);
          setHasMore(res.data.length === LIMIT);
        } else {
          if (resetFlag) setTransactions([]);
          setHasMore(false);
        }
      } catch {
        toast.error("Failed to load transactions ❌");
      } finally {
        setLoading(false);
      }
    },
    [offset, projectId]
  );

  const lastRowRef = useCallback(
    (node: HTMLElement | null) => {
      if (!hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchTransactions({ offset });
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchTransactions, offset, hasMore]
  );

  /* =========================
     INIT
  ========================= */
  useEffect(() => {
      fetchProjectMembers();
    fetchAccountLedgers();
    fetchTransactions({ offset: 0, reset: true });
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <FormProvider {...methods}>
      <div className="bg-white p-6 space-y-6">
       
        <div className="space-y-4  w-[800px] max-w-full">
          <Row label="Date">
            <FormField type="datepicker" name="date" />
          </Row>

          <Row label="Contact">
          
  <FormField
    type="typeahead"
    name="contact_id"
    placeholder={
      isContactsLoading ? "Loading contacts..." : "Select contact"
    }
    options={contacts}
    disabled={isContactsLoading || loading}
    validation={{ required: "Contact is required" }}
  />
 

          </Row>
<Row label="Type">
  <FormField
    type="radio"
    name="transaction_type"
    options={[
      { label: "Received", value: "received" },
      { label: "Paid", value: "paid" },
    ]}
  />
</Row>

          <Row label="Mode">
            <FormField
              type="radio"
              name="mode"
              options={[
                { label: "Cash", value: "cash" },
                { label: "Cheque", value: "cheque" },
                { label: "Transfer", value: "transfer" },
              ]}
            />
          </Row>

       {mode !== "cash" && (
  <Row label="Account">
    <FormField
      type="typeahead"
      name="account_ledger_id"
      placeholder={
        isAccountsLoading ? "Loading accounts..." : "Select account"
      }
      options={accountLedgers}
      disabled={isAccountsLoading || loading}
      validation={{ required: "Account is required" }}
    />
  </Row>
)}


          <Row label="Amount">
            <FormField
              type="input"
              name="amount"
              className="only-numbers"
            />
          </Row>

          <div className="flex justify-end">
            <Button onClick={methods.handleSubmit(handleSubmit)}>
              Add Transaction
            </Button>
          </div>
        </div>

        {/* LIST */}
        <div className="border rounded-lg max-h-[calc(100vh-360px)] overflow-y-auto">
          <table className="table-default w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Date</th>
                <th>Contact</th>
                <th>Mode</th>
                <th>Account</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}

              {transactions.map((t, i) => {
                const isLast = i === transactions.length - 1;
                return (
                  <tr key={t.id} ref={isLast ? lastRowRef : null}>
                    <td>{t.date}</td>
                    <td>{t.contact_name}</td>
                    <td className="capitalize">{t.mode}</td>
                    <td>{t.account_name || "-"}</td>
                    <td className="text-right font-medium">{t.amount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div className="p-3 text-center text-sm text-gray-600">
              Loading...
            </div>
          )}

          {!hasMore && transactions.length > 0 && (
            <div className="p-3 text-center text-sm text-gray-600">
              No more transactions
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
