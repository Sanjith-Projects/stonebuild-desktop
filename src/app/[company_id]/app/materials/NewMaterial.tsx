 "use client";

import { useForm, FormProvider, SubmitHandler, useFieldArray } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";

type Option = { label: string; value: string };

type AdditionalUnit = {
  unit: Option | null | string;
  quantity: string;
};

type FormValues = {
  material_name: string;
  short_code: string;
  hsn: string;
  main_unit: Option | string | null;
  additional_units: AdditionalUnit[];
};

export default function MaterialForm() {
  const methods = useForm<FormValues>({
    defaultValues: {
      material_name: "",
      short_code: "",
      hsn: "",
      main_unit: null,
      additional_units: [],
    },
  });

  // unit options come ONLY from API
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [isUnitsLoading, setIsUnitsLoading] = useState<boolean>(true);

  // existing category state (unchanged)
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);

  // fetch units from backend and set as opts (no defaults)
  const fetchUnits = async () => {
    setIsUnitsLoading(true);
    try {
      const payload = {
       token: "getLedgerType",
        data: { ledger_type: "unit_ledger" },
      };
      const res = await postRequest(payload);
      if (res && res.success && Array.isArray(res.data)) {
        const opts = res.data.map((u: any) => ({
          label: u.ledger_name ??String(u.value ?? ""),
          value: String(u.id ??""),
        }));
        setUnitOptions(opts);
      } else {
        // API returned non-success or non-array -> empty options
        setUnitOptions([]);
        toast.error("Units API returned no data.");
      }
    } catch (err) {
      setUnitOptions([]);
      toast.error("Failed to load units from API ❌");
    } finally {
      setIsUnitsLoading(false);
    }
  };

   

  useEffect(() => {
    fetchUnits();
   
  }, []);

  const { control, watch, setValue } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "additional_units",
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  // Normalizer
  const getUnitValue = (u: Option | string | null | undefined) => {
    if (!u) return null;
    if (typeof u === "string") return u;
    return (u as Option).value ?? null;
  };

  // Watchers
  const watchedMainUnit = watch("main_unit");
  const watchedAdditional = watch("additional_units") || [];
  const watchedMainUnitVal = getUnitValue(watchedMainUnit);

  // Clear duplicate additional units when main changes
  useEffect(() => {
    if (!watchedMainUnitVal) return;
    (watchedAdditional || []).forEach((a: AdditionalUnit, i: number) => {
      const aVal = getUnitValue(a?.unit);
      if (aVal === watchedMainUnitVal) {
        setValue(`additional_units.${i}.unit`, null, { shouldDirty: true, shouldTouch: true });
      }
    });
  }, [watchedMainUnitVal, watchedAdditional, setValue]);

  // Filtered options for a given additional-unit row (exclude main and other selected additional units)
  const getOptionsForRow = (rowIndex: number): Option[] => {
    const exclude = new Set<string>();
    if (watchedMainUnitVal) exclude.add(watchedMainUnitVal);

    (watchedAdditional || []).forEach((a: AdditionalUnit, i: number) => {
      const v = getUnitValue(a?.unit);
      if (v && i !== rowIndex) exclude.add(v);
    });

    return unitOptions.filter((u) => !exclude.has(u.value));
  };

  const totalAdditional = useMemo(
    () =>
      (watchedAdditional || []).filter((a: AdditionalUnit) => !!getUnitValue(a?.unit)).length,
    [watchedAdditional]
  );

  // Can't add unless units loaded and main is selected and there remain unselected units
  const canAddMoreUnits = () => {
    if (isUnitsLoading) return false;
    if (!watchedMainUnitVal) return false;
    const selectedUnits = new Set<string>();
    selectedUnits.add(watchedMainUnitVal);
    (watchedAdditional || []).forEach((a: AdditionalUnit) => {
      const v = getUnitValue(a?.unit);
      if (v) selectedUnits.add(v);
    });
    return selectedUnits.size < unitOptions.length;
  };

  const handleAppendUnit = () => {
    if (!canAddMoreUnits()) return;
    append({ unit: null, quantity: "" });
  };

  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const payload = {
        token: "addMaterial",
        data: {
          material_name: formData.material_name,
          short_code: formData.short_code,
          hsn: formData.hsn,
          main_unit_id: formData.main_unit ? getUnitValue(formData.main_unit) : null,
          additional_units: (formData.additional_units || [])
            .map((a) => ({
              unit_id: getUnitValue(a.unit),
              quantity: a.quantity,
            }))
            .filter((a) => a.unit_id && a.quantity !== ""),
        },
      };

      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Material added successfully ✅");
        methods.reset();
      } else {
        toast.error(res.message || "Failed to add material ❌");
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

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="w-1/3 font-medium text-gray-700 text-[15px]">{label}</label>
      <div className="w-2/3">{children}</div>
    </div>
  );

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col bg-white py-6">
        <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto px-3 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT — material basic details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-[#103BB5] mb-2">Material Details</h2>
              <div className="space-y-4">
                <Row label="Material Name">
                  <FormField
                    type="input"
                    name="material_name"
                    placeholder="Enter material name"
                    validation={{ required: "Material name is required" }}
                  />
                </Row>

                <Row label="Short Code">
                  <FormField
                    type="input"
                    name="short_code"
                    placeholder="Enter short code"
                    className="uppercase no-space"
                  />
                </Row>

                <Row label="HSN">
                  <FormField
                    type="input"
                    name="hsn"
                    placeholder="Enter HSN"
                    className="only-numbers limit-10"
                  />
                </Row>

                <Row label="Main Unit">
                  <FormField
                    type="typeahead"
                    name="main_unit"
                    placeholder={isUnitsLoading ? "Loading units..." : "Select main unit"}
                    options={unitOptions}
                    validation={{ required: "Main unit is required" }}
                    disabled={isUnitsLoading || loading}
                  />
                </Row>
              </div>
            </div>

            {/* RIGHT — Additional Units (multiple) */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-[#103BB5] mt-6">Additional Units</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <FormField
                          type="typeahead"
                          name={`additional_units.${idx}.unit`}
                          placeholder={`Select unit #${idx + 1}`}
                          options={getOptionsForRow(idx)}
                          disabled={!watchedMainUnitVal || isUnitsLoading || loading}
                        />

                        <FormField
                          type="input"
                          name={`additional_units.${idx}.quantity`}
                          placeholder="Quantity"
                          className="numbers-decimal"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {fields.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => remove(idx)}
                            className="h-9"
                            disabled={loading}
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
                        onClick={handleAppendUnit}
                        disabled={loading || !canAddMoreUnits()}
                        title={
                          isUnitsLoading
                            ? "Loading units..."
                            : !watchedMainUnitVal
                            ? "Please select main unit first"
                            : ""
                        }
                      >
                        Add Unit
                      </Button>
                    </div>
                  </div>

                  {/* <div className="pt-2">
                    <div className="text-sm text-gray-600">
                      Units added: <span className="font-semibold">{totalAdditional}</span>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 left-68 w-[calc(100%-16rem)] bg-white border-t py-2 px-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>

          <Button
            variant="default"
            type="submit"
            onClick={methods.handleSubmit(handleFormSubmit)}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </footer>
      </div>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this material?"
      />
    </FormProvider>
  );
}
