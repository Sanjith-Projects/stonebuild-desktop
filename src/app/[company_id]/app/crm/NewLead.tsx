 "use client";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";

type FormValues = {
  lead_name: string;
  phone: string;
  address: string;
  pincode: string;
  state: string;
  requirement: string;
};

export default function LeadForm() {
  const methods = useForm<FormValues>({
    defaultValues: {
      lead_name: "",
      phone: "",
      address: "",
      pincode: "",
      state: "",
      requirement: "house",
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
        token: "addLead",
        data: formData,
      };
      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Lead added successfully ✅");
        methods.reset();
      } else {
        toast.error(res.message || "Failed to add lead ❌");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setFormData(null);
    }
  };

  const handleCancel = () => {
    methods.reset();
    setFormData(null);
    setShowConfirm(false);
  };

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
      <div className="w-2/3">{children}</div>
    </div>
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="flex flex-col bg-white py-6"
      >
        <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto px-3 pb-32">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            <div className="space-y-6">
            
              <div className="space-y-4">
                <Row label="Contact Name">
                  <FormField
                    type="input"
                    name="lead_name"
                    placeholder="Enter Contact name"
                    className="capitalize"
                    validation={{ required: "Contact Name is required" }}
                  />
                </Row>

                <Row label="Phone Number">
                  <FormField
                    type="input"
                    name="phone"
                    placeholder="Enter 10 Digit Phone number"
                    className="only-number no-space limit-10"
                    validation={{ required: "Phone Number is required" }}
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

                   <Row label="Mode">
                            <FormField
                              type="radio"
                              name="requirement"
                              options={[
                                { label: "house", value: "house" },
                                { label: "Apartment", value: "apartment" },
                                { label: "Renovation", value: "renovation" },
                               { label: "Commercial", value: "commercial" },
 ]}
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
          >
            {loading ? "Submitting..." : "Submit"}
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
        message="Are you sure you want to add this lead?"
      />
    </FormProvider>
  );
}
