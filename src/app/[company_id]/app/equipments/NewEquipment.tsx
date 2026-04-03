 "use client";
import { useForm, FormProvider, SubmitHandler, useFieldArray } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";
import { format } from "date-fns";
 
type FormValues = {
  equipment_name: string;
  equipment_codes: { value: string }[]; // array of objects for useFieldArray
  brand: string;
  model: string;
  status: "active" | "inactive";
  purchase_date: string;
  last_service_date: string;
  next_service_date: string;
};

export default function EquipmentForm() {
  const todayStr = format(new Date(), "dd/MM/yyyy");

  const methods = useForm<FormValues>({
    defaultValues: {
      equipment_name: "",
      equipment_codes: [{ value: "" }], // start with one input
      brand: "",
      model: "",
      status: "active",
      purchase_date: todayStr,
      last_service_date: todayStr,
      next_service_date: todayStr,
    },
  });

  const { control, watch } = methods;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipment_codes",
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
      // Transform equipment_codes back to string array for API
      const payload = {
        token: "addEquipment",
        data: {
          ...formData,
          equipment_codes: formData.equipment_codes
            .map(c => c.value.trim())
            .filter(c => c !== ""), // only send non-empty codes
        },
      };
      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Equipment added successfully ✅");
        methods.reset(); // reset to default values
      } else {
        toast.error(res.message || "Failed to add equipment ❌");
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

  // compute total number of non-empty equipment codes
  const watchedCodes = watch("equipment_codes") || [];
  const totalCount = useMemo(
    () => watchedCodes.filter((c) => (c?.value || "").trim() !== "").length,
    [JSON.stringify(watchedCodes)]
  );

  const Row = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="w-1/3 font-medium text-gray-700 text-[15px]">{label}</label>
      <div className="w-2/3">{children}</div>
    </div>
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="flex flex-col bg-white py-6">
        <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto px-3 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT COLUMN — Main equipment details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-[#103BB5] mb-2">Equipment Details</h2>
              <div className="space-y-4">
                <Row label="Equipment Name">
                  <FormField
                    type="input"
                    name="equipment_name"
                    placeholder="Enter equipment name"
                    className="capitalize"
                    validation={{ required: "Equipment Name is required" }}
                  />
                </Row>

                <Row label="Brand">
                  <FormField
                    type="input"
                    name="brand"
                    placeholder="Enter brand"
                  />
                </Row>

                <Row label="Model">
                  <FormField
                    type="input"
                    name="model"
                    placeholder="Enter model"
                  />
                </Row>

                <Row label="Status">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...methods.register("status")}
                        value="active"
                        defaultChecked
                        className="accent-[#103BB5]"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        {...methods.register("status")} 
                        value="inactive" 
                        className="accent-[#103BB5]" 
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </Row>

                <Row label="Purchase Date">
                  <FormField 
                    type="datepicker" 
                    name="purchase_date" 
                    placeholder="Select purchase date" 
                  />
                </Row>

                <Row label="Last Service Date">
                  <FormField 
                    type="datepicker" 
                    name="last_service_date" 
                    placeholder="Select last service date" 
                  />
                </Row>

                <Row label="Next Service Date">
                  <FormField 
                    type="datepicker" 
                    name="next_service_date" 
                    placeholder="Select next service date" 
                  />
                </Row>
              </div>
            </div>

            {/* RIGHT COLUMN — Equipment Codes (multiple) */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-[#103BB5] mt-6">Equipment Codes</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <FormField
                          type="input"
                          name={`equipment_codes.${idx}.value`}
                          placeholder={`Enter equipment code #${idx + 1}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Remove button (only show if more than one) */}
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => remove(idx)}
                            className="h-9"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <div />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => append({ value: "" })}
                        disabled={loading}
                      >
                        Add Code
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-sm text-gray-600">
                      Total Count: <span className="font-semibold">{totalCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER WITH SUBMIT + CANCEL */}
        <footer className="fixed bottom-0 left-68 w-[calc(100%-16rem)] bg-white border-t py-2 px-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>

          <Button variant="default" type="submit" disabled={loading}>
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
        message="Are you sure you want to add this equipment?"
      />
    </FormProvider>
  );
}






 