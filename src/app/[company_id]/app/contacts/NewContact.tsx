"use client";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

type FormValues = {
  full_name: string;
  dob: string;
  phone: string;
  alternate_phone: string;
  email: string;
  address: string;
  pincode: string;
  state: string;
  bank_account: string;
  ifsc: string;
  branch_name: string;
  bank_name: string;
  aadhaar: string;
  pan: string;
  // if you're using these in form:
  registeration_id?: string;
  gst_no?: string;
};
 type ContactFormProps = {
  editId: string | null;
};

export default function ContactForm({ editId }: ContactFormProps) {
const router = useRouter();
 const pathname = usePathname();
  const todayStr = format(new Date(), "dd/MM/yyyy");

  const methods = useForm<FormValues>({
    defaultValues: {
      full_name: "",
      dob: todayStr,
      phone: "",
      alternate_phone: "",
      email: "",
      address: "",
      pincode: "",
      state: "",
      bank_account: "",
      ifsc: "",
      branch_name: "",
      bank_name: "",
      aadhaar: "",
      pan: "",
      registeration_id: "",
      gst_no: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

 const confirmSubmit = async () => {
  if (!formData) return;
  setLoading(true);
  try {
    const payload = {
      token: "addContact",
      data: {
        ...formData,
        contact_id: editId ?? null,  // ⬅ add ID for update
      },
    };

    const res = await postRequest(payload);

    if (res.success) {
      toast.success(editId ? "Contact updated 👍" : "Contact added successfully ✅");
      methods.reset();
        router.push(`${pathname}`);
    } else {
      toast.error(res.message || "Failed ❌");
    }
  } catch (err: any) {
    toast.error(err.message || "Something went wrong ❌");
  } finally {
    setLoading(false);
    setShowConfirm(false);
  }
};


const fillFormValues = (data: any) => {
  Object.keys(data).forEach((key) => {
    if (methods.getValues(key as keyof FormValues) !== undefined) {
      methods.setValue(key as keyof FormValues, data[key] ?? "");
    }
  });
};


 useEffect(() => {
  if (!editId) return;

  const fetchContact = async () => {
    const res = await postRequest({
      token: "getContactById",
      data: { contact_id: editId },
    });

    if (res?.success && res.data) {
      fillFormValues(res.data); // ⬅ populate form
    }
  };

  fetchContact();
}, [editId]);


  const handleCancel = () => {
    methods.reset();      // clears the form back to defaultValues
    setFormData(null);    // clear any staged data
    setShowConfirm(false);
       router.push(`${pathname}`);
  };

 const Row = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <label className="w-1/3 font-medium text-gray-700 text-[15px]">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="w-2/3">{children}</div>
  </div>
);


  const onInvalid = (errors: any) => {
  // You can log to see which fields failed:
  console.log(errors);
  toast.error("Please fill all mandatory fields ❗");
};


  return (
    <FormProvider {...methods}>
      <form
          
        className="flex flex-col bg-white py-6"
      >
        <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto px-3 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT COLUMN — Basic Details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-[#103BB5] mb-2">
                Basic Details
              </h2>
              <div className="space-y-4">
                <Row label="Full Name" required>
                  <FormField
                    type="input"
                    name="full_name"
                    placeholder="Enter Full name"
                    className="capitalize"
   validation={{ required: "Contact Name is required" }}                  />
                </Row>

                <Row label="Phone Number" required>
                  <FormField
                    type="input"
                    name="phone"
                    placeholder="Enter 10 Digit Phone number"
                    className="only-number limit-10"
                    validation={{ required: "Phone Number is required" }}
                  />
                </Row>
                <Row label="Alternate Number">
                  <FormField
                    type="input"
                    name="alternate_phone"
                    placeholder="Enter Alternate number"
                    className="only-number no-space limit-10"
                  />
                </Row>
                <Row label="Email">
                  <FormField
                    type="input"
                    name="email"
                    placeholder="Enter Email"
                  />
                </Row>
                <Row label="Address">
                  <FormField
                    type="textarea"
                    name="address"
                    placeholder="Enter address"
                  />
                </Row>
                <Row label="Pincode">
                  <FormField
                    type="input"
                    name="pincode"
                    placeholder="Enter 6-Digit Pincode"
                    className="only-number no-space limit-6"
                  />
                </Row>
                <Row label="State">
                  <FormField
                    type="input"
                    name="state"
                    placeholder="Enter State"
                    className="uppercase"
                  />
                </Row>
              </div>
            </div>

            {/* RIGHT COLUMN — Bank & Proof Details */}
            <div className="space-y-6">
              {/* BANK DETAILS */}
              <h2 className="text-lg font-medium text-[#103BB5] mt-6">
                Bank Details
              </h2>
              <div className="space-y-4">
                <Row label="Bank Account Number">
                  <FormField
                    type="input"
                    name="bank_account"
                    placeholder="Enter Account number"
                    className="only-number no-space"
                  />
                </Row>
                <Row label="IFSC Code">
                  <FormField
                    type="input"
                    name="ifsc"
                    placeholder="Enter 11-Digit IFSC code"
                    className="alphanumeric-uppercase no-space limit-11"
                  />
                </Row>
                <Row label="Branch Name">
                  <FormField
                    type="input"
                    name="branch_name"
                    placeholder="Enter Branch name"
                    className="uppercase only-alphabets"
                  />
                </Row>
                <Row label="Bank Name">
                  <FormField
                    type="input"
                    name="bank_name"
                    placeholder="Enter Bank name"
                    className="uppercase only-alphabets"
                  />
                </Row>
              </div>

              {/* PROOF DETAILS */}
              <h2 className="text-lg font-medium text-[#103BB5] mt-6">
                Proof Details
              </h2>
              <div className="space-y-4">
                <Row label="Aadhaar Number">
                  <FormField
                    type="input"
                    name="aadhaar"
                    placeholder="Enter 12-Digit Aadhaar number"
                    className="only-number no-space limit-12"
                  />
                </Row>
                <Row label="PAN Number">
                  <FormField
                    type="input"
                    name="pan"
                    placeholder="Enter 10-Digit PAN number"
                    className="alphanumeric-uppercase no-space limit-10"
                  />
                </Row>
                <Row label="Registeration ID">
                  <FormField
                    type="input"
                    name="registeration_id"
                    placeholder="Enter Registeration ID"
                    className="alphanumeric-uppercase"
                  />
                </Row>
                <Row label="GST Number">
                  <FormField
                    type="input"
                    name="gst_no"
                    placeholder="Enter GST Number"
                    className="alphanumeric-uppercase"
                  />
                </Row>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER WITH SUBMIT + CANCEL */}
        <footer className="fixed bottom-0 left-68 w-[calc(100%-16rem)] bg-white border-t py-2 px-6 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>

       <Button
  variant="default"
  type="submit"
  disabled={loading}
  onClick={methods.handleSubmit(handleFormSubmit, onInvalid)}
>
  {loading ? "Submitting..." : editId ? "Update Contact" : "Add Contact"}
</Button>

        </footer>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this contact?"
      />
    </FormProvider>
  );
}
