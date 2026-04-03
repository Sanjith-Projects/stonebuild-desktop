 "use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useForm,
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";

type Option = { label: string; value: string };

type ItemRow = {
  material: Option | string | null;
  unit: Option | string | null;
  quantity: string; // store as string to match FormField
  rate: string;
  tax_amount: string; // explicit tax amount
  tax_percent: string; // tax percentage (optional)
};

type ChargeRow = {
  description: string;
  amount: string;
};

type FormValues = {
  supplier: Option | string | null;
  date: string | null; // ISO date string from datepicker
  invoice_number: string;
  items: ItemRow[];
  additional_charges: ChargeRow[];
};

export default function PurchaseForm() {
  const methods = useForm<FormValues>({
    defaultValues: {
      supplier: null,
      date: null,
      invoice_number: "",
      items: [],
      additional_charges: [],
    },
  });

  const { control, handleSubmit, setValue, getValues } = methods;

  // options come from API
  const [supplierOptions, setSupplierOptions] = useState<Option[]>([]);
  const [materialOptions, setMaterialOptions] = useState<Option[]>([]);
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // fetch lists
  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      // Example payloads — adapt tokens/names to your backend
      const suppliersRes = await postRequest({ token: "getLedgerType", data: { ledger_type: "supplier_ledger" } });
      if (suppliersRes && suppliersRes.success && Array.isArray(suppliersRes.data)) {
        setSupplierOptions(
          suppliersRes.data.map((s: any) => ({ label: s.ledger_name ?? String(s.value ?? ""), value: String(s.id ?? "") }))
        );
      }

      const unitsRes = await postRequest({ token: "getLedgerType", data: { ledger_type: "unit_ledger" } });
      if (unitsRes && unitsRes.success && Array.isArray(unitsRes.data)) {
        setUnitOptions(unitsRes.data.map((u: any) => ({ label: u.ledger_name ?? String(u.value ?? ""), value: String(u.id ?? "") })));
      }

      // materials — adapt token
      const matsRes = await postRequest({ token: "getMaterials", data: {} });
      if (matsRes && matsRes.success && Array.isArray(matsRes.data)) {
        setMaterialOptions(matsRes.data.map((m: any) => ({ label: m.material_name ?? String(m.name ?? ""), value: String(m.id ?? "") })));
      }
    } catch (err) {
      toast.error("Failed to load options");
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Field arrays
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: "items" });

  const {
    fields: chargeFields,
    append: appendCharge,
    remove: removeCharge,
  } = useFieldArray({ control, name: "additional_charges" });

  // watch items and charges to compute totals live
  const watchedItems = useWatch({ control, name: "items" }) || [];
  const watchedCharges = useWatch({ control, name: "additional_charges" }) || [];

  const parseNumber = (v: any) => {
    const n = parseFloat(String(v || "").replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // compute derived amounts per item and totals
  const computedLines = useMemo(() => {
    return (watchedItems || []).map((it: ItemRow) => {
      const qty = parseNumber(it.quantity);
      const rate = parseNumber(it.rate);
      const explicitTax = parseNumber(it.tax_amount);
      const taxPercent = parseNumber(it.tax_percent);

      const base = qty * rate;
      const taxFromPercent = taxPercent ? (base * taxPercent) / 100 : 0;
      const tax = explicitTax || taxFromPercent;
      const totalLine = base + tax;
      return { base, tax, totalLine };
    });
  }, [watchedItems]);

  const subtotal = useMemo(() => computedLines.reduce((s, l) => s + l.base, 0), [computedLines]);
  const totalTax = useMemo(() => computedLines.reduce((s, l) => s + l.tax, 0), [computedLines]);
  const additionalTotal = useMemo(() => (watchedCharges || []).reduce((s: number, c: ChargeRow) => s + parseNumber(c.amount), 0), [watchedCharges]);
  const grandTotal = useMemo(() => subtotal + totalTax + additionalTotal, [subtotal, totalTax, additionalTotal]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<FormValues | null>(null);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setPendingPayload(data);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!pendingPayload) return;
    setLoadingSubmit(true);
    try {
      const payload = {
        token: "createPurchase",
        data: {
          supplier_id: pendingPayload.supplier ? (typeof pendingPayload.supplier === "string" ? pendingPayload.supplier : pendingPayload.supplier.value) : null,
          date: pendingPayload.date,
          invoice_number: pendingPayload.invoice_number,
          items: (pendingPayload.items || []).map((it) => ({
            material_id: it.material ? (typeof it.material === "string" ? it.material : it.material.value) : null,
            unit_id: it.unit ? (typeof it.unit === "string" ? it.unit : it.unit.value) : null,
            quantity: it.quantity,
            rate: it.rate,
            tax_amount: it.tax_amount,
            tax_percent: it.tax_percent,
          })),
          additional_charges: (pendingPayload.additional_charges || []).map((c) => ({ description: c.description, amount: c.amount })),
          totals: { subtotal, tax: totalTax, additional: additionalTotal, grand_total: grandTotal },
        },
      };

      const res = await postRequest(payload);
      if (res && res.success) {
        toast.success("Purchase saved successfully");
        methods.reset();
      } else {
        toast.error(res?.message || "Failed to save purchase");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoadingSubmit(false);
      setShowConfirm(false);
      setPendingPayload(null);
    }
  };

  const handleAddItem = () => {
    appendItem({ material: null, unit: null, quantity: "", rate: "", tax_amount: "", tax_percent: "" });
  };

  const handleAddCharge = () => {
    appendCharge({ description: "", amount: "" });
  };

  const RowLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="font-medium text-sm text-gray-700">{children}</div>
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <RowLabel>Supplier</RowLabel>
            <FormField
              type="typeahead"
              name="supplier"
              placeholder={loadingOptions ? "Loading suppliers..." : "Select supplier"}
              options={supplierOptions}
            />
          </div>

          <div>
            <RowLabel>Date</RowLabel>
            <FormField type="datepicker" name="date" placeholder="Select date" />
          </div>

          <div>
            <RowLabel>Invoice Number</RowLabel>
            <FormField type="input" name="invoice_number" placeholder="Invoice #" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-[#103BB5] mb-3">Materials</h3>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">S.no</th>
                  <th className="p-2">Material</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Rate</th>
                  <th className="p-2">Tax Amount</th>
                  <th className="p-2">Tax %</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {itemFields.map((field, idx) => (
                  <tr key={field.id} className="border-t">
                    <td className="p-2 align-top">{idx + 1}</td>
                    <td className="p-2 align-top w-1/4">
                      <FormField type="typeahead" name={`items.${idx}.material`} options={materialOptions} placeholder={`Select material #${idx + 1}`} />
                    </td>

                    <td className="p-2 align-top w-1/6">
                      <FormField type="typeahead" name={`items.${idx}.unit`} options={unitOptions} placeholder="Select unit" />
                    </td>

                    <td className="p-2 align-top w-1/12">
                      <FormField type="input" name={`items.${idx}.quantity`} placeholder="0" className="numbers-decimal" />
                    </td>

                    <td className="p-2 align-top w-1/12">
                      <FormField type="input" name={`items.${idx}.rate`} placeholder="0" className="numbers-decimal" />
                    </td>

                    <td className="p-2 align-top w-1/12">
                      <FormField type="input" name={`items.${idx}.tax_amount`} placeholder="Tax" className="numbers-decimal" />
                    </td>

                    <td className="p-2 align-top w-1/12">
                      <FormField type="input" name={`items.${idx}.tax_percent`} placeholder="%" className="numbers-decimal" />
                    </td>

                    <td className="p-2 align-top">
                      <div className="pt-2">
                        {computedLines[idx] ? computedLines[idx].totalLine.toFixed(2) : "0.00"}
                      </div>
                    </td>

                    <td className="p-2 align-top">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => removeItem(idx)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {itemFields.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-sm text-gray-500">
                      No items added. Click Add Item to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-3">
            <Button type="button" variant="secondary" onClick={handleAddItem} disabled={loadingOptions}>Add Item</Button>
          </div>
        </div>

        {/* Additional charges */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-[#103BB5] mb-3">Additional Charges</h3>

          <div className="space-y-2">
            {chargeFields.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <FormField type="input" name={`additional_charges.${i}.description`} placeholder="Description" />
                </div>
                <div className="w-40">
                  <FormField type="input" name={`additional_charges.${i}.amount`} placeholder="Amount" className="numbers-decimal" />
                </div>
                <div>
                  <Button type="button" variant="outline" onClick={() => removeCharge(i)}>Remove</Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={handleAddCharge}>Add Charge</Button>
            </div>
          </div>
        </div>

        {/* Totals summary */}
        <div className="mt-6 flex justify-end">
          <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded">
            <div className="flex justify-between py-1">
              <div>Sub total</div>
              <div className="font-semibold">{subtotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between py-1">
              <div>Tax Charges</div>
              <div className="font-semibold">{totalTax.toFixed(2)}</div>
            </div>
            <div className="flex justify-between py-1">
              <div>Additional Charges</div>
              <div className="font-semibold">{additionalTotal.toFixed(2)}</div>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between text-lg font-bold">
              <div>Total</div>
              <div>{grandTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => methods.reset()}>Cancel</Button>
          <Button type="submit">Save Purchase</Button>
        </div>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loadingSubmit}
        title="Confirm Purchase"
        message={`Are you sure you want to save this purchase? Total: ${grandTotal.toFixed(2)}`}
      />
    </FormProvider>
  );
}
