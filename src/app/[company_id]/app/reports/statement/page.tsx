  "use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { TypeaheadField } from "../../utils/typeheadField";
import { postRequest } from "../../utils/api";

type FilterForm = {
  from: string;
  to: string;
  // no `type`
};

// reuse Row as before
const Row = ({ label, children }: { label?: string | null; children: React.ReactNode }) => (
  <div className={`flex items-start gap-4 mb-2`}>
    {label ? (
      <>
        <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
        <div className="w-2/3">{children}</div>
      </>
    ) : (
      <div className="w-full">{children}</div>
    )}
  </div>
);

export default function StatementPage() {
  const methods = useForm<FilterForm>({
    defaultValues: {
      from: "",
      to: "",
    },
  });

  // shape matches columns used below (party + outstanding)
  const [dayBook, setDayBook] = useState<
    Array<{
      date?: string;
      party?: string;
      description?: string;
      account?: string;
      mode?: string;
      outstanding?: number | string;
    }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [contactOptions, setContactOptions] = useState<{ label: string; value: string }[]>([]);
  const fetchContacts = async () => {
    const res = await postRequest({ token: "getContacts" });
    if (res.success) {
      
      setContactOptions(res.data.map((c: any) => ({ label: c.full_name, value: c.id })));
    }
  };
    useEffect(() => {
      fetchContacts();
      
    }, []);
  const onSubmit: SubmitHandler<FilterForm> = async (data) => {
    setSubmitting(true);
    try {
      // In real app call API with from/to
      // const res = await fetch(`/api/daybook/outstanding?from=${data.from}&to=${data.to}`);
      // const json = await res.json();
      // setDayBook(json);

      console.log("Filter DayBook (outstanding) with:", data);

      // keep empty as requested
      setDayBook([]);
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
                        
            <Row label={""}>
              <div className="w-full">
                <label className="block font-medium text-gray-700 mb-2 text-[16px]">Contact</label>
                   <TypeaheadField
                            name="contact_id"
                            options={contactOptions}
                            placeholder="Search and select contact..."
                           />
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

        {/* Outstanding-style Table */}
        <div className="mt-6 overflow-x-auto border rounded-lg">
          <table className="table-default w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="text-center">S.No</th>
                <th>Date</th>
                <th>Party</th>
                <th>Description</th>
                <th>Account</th>
                <th>Mode</th>
                <th className="text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {dayBook.length > 0 ? (
                dayBook.map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="text-center">{i + 1}</td>
                    <td>{entry.date}</td>
                    <td>{entry.party}</td>
                    <td>{entry.description}</td>
                    <td>{entry.account}</td>
                    <td>{entry.mode}</td>
                    <td className="text-right">{entry.outstanding}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-gray-500">
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
