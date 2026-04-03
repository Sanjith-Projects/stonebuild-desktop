 "use client";

import { useForm, FormProvider, useFieldArray, SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "../../utils/formField";
import { TypeaheadField } from "../../utils/typeheadField";
import { postRequest } from "../../utils/api";
import toast from "react-hot-toast";
import { Calculator, Award, TrendingUp } from "lucide-react";
import ConfirmModal from "../../utils/confirmationModal";

// ---------------- TYPES ----------------
type LoanApply = {
  contact_id: string;
  scheme_id: string;
  loan_taken_amount: number | string;
  interest_percent?: number | string;
  interest_per_month?: number | string;
  date?: string;
  status?: string;
};

type Contact = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  email?: string;
  aadhaar?: string;
  pan?: string;
};

// ---------------- ROW WRAPPER ----------------
const FormRow = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <label className="sm:w-1/3 font-medium text-gray-700 text-[17px] text-sm">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="sm:w-2/3">{children}</div>
  </div>
);

// ---------------- CARD WRAPPER ----------------
 const Card = ({
  title,
  children,
  className = "",
  icon,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-200 bg-[#f6f6f6]">
        {typeof title === "string" ? (
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#103BB5]">{icon}</span>}
            <h3 className="text-lg font-semibold text-[#103BB5]">{title}</h3>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {icon && <span className="text-[#103BB5]">{icon}</span>}
            </div>
            {title}
          </div>
        )}
      </div>
    )}

    <div className="p-6">{children}</div>
  </div>
);

// ---------------- MAIN FORM ----------------
export default function PersonalLoanApplyForm() {
  const methods = useForm<LoanApply>({
    defaultValues: {
      contact_id: "",
      scheme_id: "",
      loan_taken_amount: "",
      interest_percent: "",
      interest_per_month: "",
      date: "",
      status: "applied",
    },
  });

  const { watch, setValue, reset } = methods;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactOptions, setContactOptions] = useState<{ label: string; value: string }[]>([]);
  const [schemeOptions, setSchemeOptions] = useState<
    { label: string; value: string; interest_rate: number }[]
  >([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const watchedSchemeId = watch("scheme_id");
  const watchedLoanTaken = watch("loan_taken_amount");

  useEffect(() => {
    fetchSchemes();
    fetchContacts();
  }, []);

  const fetchSchemes = async () => {
    const res = await postRequest({ token: "getPersonalLoanScheme" });
    if (res.success) {
      setSchemeOptions(
        res.data.map((s: any) => ({
          label: s.scheme_name,
          value: s.id,
          interest_rate: s.interest_rate,
        }))
      );
    }
  };

  const fetchContacts = async () => {
    const res = await postRequest({ token: "getContacts" });
    if (res.success) {
      setContacts(res.data);
      setContactOptions(res.data.map((c: any) => ({ label: c.full_name, value: c.id })));
    }
  };

  const handleContactChange = (id: string) => {
    const found = contacts.find((c) => c.id === id) || null;
    setSelectedContact(found);
  };

  // ---------------- CALCULATE LOAN ----------------
  const [loanSummary, setLoanSummary] = useState({
    emi: 0,
    interestPercent: 0,
    interestPerMonth: 0,
  });

  useEffect(() => {
    const scheme = schemeOptions.find((s) => s.value === watchedSchemeId);
    setSelectedScheme(scheme || null);

    const loanTaken = parseFloat(String(watchedLoanTaken)) || 0;
    const interestRate = scheme?.interest_rate || 0;
    const interestPerMonth = (loanTaken * interestRate) / 100 / 12;

    setLoanSummary({
      emi: calculateEMI(loanTaken, interestRate, 12),
      interestPercent: interestRate,
      interestPerMonth,
    });

    // set interest fields for submission preview
    setValue("interest_percent", interestRate);
    setValue("interest_per_month", Number(interestPerMonth.toFixed(2)));
  }, [watchedSchemeId, watchedLoanTaken, schemeOptions]);

  // EMI Formula
  const calculateEMI = (principal: number, annualRate: number, months: number) => {
    const r = annualRate / 12 / 100;
    if (!r || !principal) return 0;
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  };

  // Format date as dd/mm/yyyy
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit: SubmitHandler<LoanApply> = async (data) => {
    const loanTaken = parseFloat(String(data.loan_taken_amount)) || 0;

    if (!data.contact_id) {
      toast.error("Please select a contact!");
      return;
    }

    if (!data.scheme_id) {
      toast.error("Please select a loan scheme!");
      return;
    }

    if (!loanTaken) {
      toast.error("Please enter loan amount!");
      return;
    }

    const payload = {
      contact_id: data.contact_id,
      scheme_id: data.scheme_id,
      loan_taken_amount: loanTaken,
      interest_percent: loanSummary.interestPercent,
      interest_per_month: loanSummary.interestPerMonth,
      date: getTodayDate(),
      status: "applied",
    };

    setFormData(payload);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const payload = {
        token: "applyPersonalLoan",
        data: formData,
      };

      const res = await postRequest(payload);

      if (res.success) {
        toast.success("Loan Applied Successfully ✅");

        // Reset form
        reset({
          contact_id: "",
          scheme_id: "",
          loan_taken_amount: "",
          interest_percent: "",
          interest_per_month: "",
          date: "",
          status: "applied",
        });

        setSelectedContact(null);
        setLoanSummary({ emi: 0, interestPercent: 0, interestPerMonth: 0 });
        setFormData(null);
      } else {
        toast.error(res.message || "Failed to apply loan ❌");
      }
    } catch (err: any) {
      toast.error(err.message || "API error ❌");
    } finally {
      setShowConfirm(false);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  };

  // ---------------- RENDER ----------------
  return (
    <FormProvider {...methods}>
      <div className="  bg-white py-8 px-4 sm:px-6 lg:px-8 mb-32 ">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Loan Application</h1>
            <p className="text-gray-600">Complete the form below to apply for a personal loan</p>
          </div>

          {/* CONTACT SECTION */}
          <Card title="Contact Details" icon={<Award className="w-5 h-5" />}>
            <FormRow label="Select Contact" required>
              <TypeaheadField
                name="contact_id"
                options={contactOptions}
                placeholder="Search and select contact..."
                onChange={(val) => handleContactChange(val)}
              />
            </FormRow>

            {selectedContact && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start text-[16px]">
                    <span className="font-semibold text-gray-700 min-w-24">Full Name:</span>
                    <span className="text-gray-900">{selectedContact.full_name}</span>
                  </div>
                  <div className="flex items-start text-[16px]">
                    <span className="font-semibold text-gray-700 min-w-24">Phone:</span>
                    <span className="text-gray-900">{selectedContact.phone}</span>
                  </div>
                  <div className="md:col-span-2 flex items-start text-[16px]">
                    <span className="font-semibold text-gray-700 min-w-24">Address:</span>
                    <span className="text-gray-900">{selectedContact.address}</span>
                  </div>
                  {selectedContact.email && (
                    <div className="flex items-start text-[16px]">
                      <span className="font-semibold text-gray-700 min-w-24">Email:</span>
                      <span className="text-gray-900">{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.aadhaar && (
                    <div className="flex items-start text-[16px]">
                      <span className="font-semibold text-gray-700 min-w-24">Aadhaar:</span>
                      <span className="text-gray-900">{selectedContact.aadhaar}</span>
                    </div>
                  )}
                  {selectedContact.pan && (
                    <div className="flex items-start text-[16px]">
                      <span className="font-semibold text-gray-700 min-w-24">PAN:</span>
                      <span className="text-gray-900">{selectedContact.pan}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* LOAN SECTION */}
          <Card title="Loan Details" icon={<Calculator className="w-5 h-5" />}>
            <div className="space-y-5">
              <FormRow label="Loan Scheme" required>
                <TypeaheadField 
                  name="scheme_id" 
                  options={schemeOptions} 
                  placeholder="Select loan scheme..." 
                />
              </FormRow>

              <FormRow label="Loan Amount Requested (₹)" required>
                <FormField 
                  name="loan_taken_amount" 
                  type="input" 
                  className="numbers-decimal" 
                  placeholder="Enter loan amount" 
                />
              </FormRow>

              {/* Loan Summary */}
              <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-semibold text-emerald-900 text-lg">Loan Summary</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-600 mb-1">Interest Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loanSummary.interestPercent}% <span className="text-sm font-normal text-gray-600">p.a.</span>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Interest Per Month</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹{formatCurrency(loanSummary.interestPerMonth)}
                    </p>
                  </div>

                  {loanSummary.emi > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg shadow-sm border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Estimated Monthly EMI (12 months)</p>
                          <p className="text-2xl font-bold text-amber-900">
                            ₹{formatCurrency(loanSummary.emi)}<span className="text-sm font-normal text-gray-600">/month</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* SUBMIT BUTTON (Fixed Footer) */}
          <footer className="mt-8 border-t pt-4 flex justify-end py-3 px-3 fixed bottom-0 left-68 right-0  bg-white border-t border-gray-200 ">
            <Button  onClick={() => methods.handleSubmit(handleSubmit)()}
                type="button"
                className="bg-[#103BB5] text-white hover:bg-[#256b45]"
              >
                 Save Loan Application
              </Button>
          </footer>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm Loan Application"
        message="Are you sure you want to submit this loan application? Please verify all details before proceeding."
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirm(false)}
        loading={loading}
      />
    </FormProvider>
  );
}
