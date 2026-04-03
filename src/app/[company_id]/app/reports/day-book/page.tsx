 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { format } from "date-fns";             // <-- add this
import { postRequest } from "../../utils/api";

type FilterForm = {
  from: string;
  to: string;
  type: string; // '', 'all', 'received', 'paid', 'expense'
};

 // replace the existing Row definition with this
const Row = ({ label, children }: { label?: string | null; children: React.ReactNode }) => (
  <div className={`flex items-start gap-4 mb-2`}>
    {label ? (
       <>
        <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
        <div className="w-2/3">{children}</div>
      </>
    ) : (
      // no label -> make children full width
      <div className="w-full">{children}</div>
    )}
  </div>
);


export default function DayBookPage() {
  const todayStr = format(new Date(), "dd/MM/yyyy"); // e.g. "13/11/2025"

  const methods = useForm<FilterForm>({
    defaultValues: {
       from: todayStr,   // <-- initialize to today
      to: todayStr,     // <-- initialize to today
      type: "", // initially no radio checked
    },
  });
 
  const [dayBook, setDayBook] = useState<any[]>([]); // empty table as requested
  const [submitting, setSubmitting] = useState(false);

  const onSubmit: SubmitHandler<FilterForm> = async (data) => {
    setSubmitting(true);
      try {
           const payload = {
             token: "daybook",
             data: data,
           };
     
           const res = await postRequest(payload);
           console.log("Day Book Response:", payload);
       setDayBook(res?.data || res); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="px-6">
 <form onSubmit={methods.handleSubmit(onSubmit)} className="w-full">
  {/* Centered card */}
  <div className="w-150 mx-auto mt-8 bg-white rounded-lg p-6">
    
    <Row label={""}>
      <div className="w-full">
        <label className="block font-medium text-gray-700 mb-2 text-[16px]">From Date</label>
        <FormField name="from" type="datepicker" placeholder="From date" />
      </div>
    </Row>

    {/* To Date */}
    <Row label={""}>
      <div className="w-full">
        <label className="block font-medium text-gray-700 mb-2 text-[16px]">To Date</label>
        <FormField name="to" type="datepicker" placeholder="To date" />
      </div>
    </Row>

    {/* Type */}
    <Row label={""}>
      <div className="w-full">
        <label className="block font-medium text-gray-700 mb-2 text-[16px]">Type</label>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
          <FormField
            name="type"
            type="radio"
            options={[
              { label: "All", value: "all" },
              { label: "Received", value: "received" },
              { label: "Paid", value: "paid" },
              { label: "Expense", value: "expense" },
            ]}
          />
        </div>
      </div>
    </Row>

    {/* Submit */}
    <Row label={""}>
      <div className="w-[150px] flex justify-left mt-[5px]">
        <Button
          type="submit"
          className="w-1/2 bg-[#103BB5] text-white hover:bg-[#256b45]"
          disabled={submitting}
        >
          {submitting ? "Filtering..." : "Submit"}
        </Button>
      </div>
    </Row>
  </div>
</form>




        {/* Table */}
        <div className="mt-6 overflow-x-auto border rounded-lg">
          <table className="table-default w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="text-center">S.No</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Account</th>
                <th>Mode</th>
                <th className="text-center">Amount</th>
                
              </tr>
            </thead>
            <tbody>
              {dayBook.length > 0 ? (
                dayBook.map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="text-center">{i + 1}</td>
                    <td>{entry.date}</td>
                    <td>{entry.entry_type}</td>
                    <td>{entry.description}</td>
                    <td>{entry.account_name}</td>
                    <td>{entry.mode}</td>
                    <td className="text-right">{entry.amount}</td>
                    
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-gray-500">
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FormProvider>
  );
}
