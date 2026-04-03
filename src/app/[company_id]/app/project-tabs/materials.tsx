 "use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

type Option = { label: string; value: string };

type MaterialFormValues = {
  date: string;
  material_id: string;
  transaction_type: "request" | "received" | "used";
  quantity: string;
  unit_id: string;
  remarks: string;
};

type MaterialRow = {
  id: number;
  transaction_date: string;
  material_name: string;
  transaction_type: string;
  quantity: string;
  unit_name: string;
  remarks?: string;
};

export default function MaterialsTab({ projectId }: any) {

  /* =========================
     ROW COMPONENT (SAME AS YOURS)
  ========================= */
  const Row = ({ label, children }: any) => (
    <div className="flex items-center justify-between gap-4">
      <label className="w-1/3 font-medium text-gray-700 text-[15px]">
        {label}
      </label>
      <div className="w-2/3 relative z-50">{children}</div>
    </div>
  );

  /* =========================
     FORM SETUP
  ========================= */
  const todayStr = format(new Date(), "dd/MM/yyyy");

  const methods = useForm<MaterialFormValues>({
    defaultValues: {
      date: todayStr,
      transaction_type: "request",
      material_id: "",
      unit_id: "",
      quantity: "",
      remarks: "",
    },
  });

  const { reset } = methods;

  /* =========================
     DROPDOWNS
  ========================= */
  const [materials, setMaterials] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const fetchMaterials = async () => {
    setLoadingDropdowns(true);
    try {
      const res = await postRequest({ token: "getMaterials" });
      if (res.success) {
        setMaterials(
          res.data.map((m: any) => ({
            label: m.material_name,
            value: String(m.id),
          }))
        );
      }
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await postRequest({ token: "getUnits" });
      if (res.success) {
        setUnits(
          res.data.map((u: any) => ({
            label: u.unit_name,
            value: String(u.id),
          }))
        );
      }
    } catch {
      toast.error("Failed to load units ❌");
    }
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (data: MaterialFormValues) => {
    try {
      const res = await postRequest({
        token: "addProjectMaterial",
        data: {
          project_id: projectId,
          transaction_date: data.date,
          material_id: data.material_id,
          unit_id: data.unit_id,
          quantity: data.quantity,
          transaction_type: data.transaction_type,
          remarks: data.remarks,
        },
      });

      if (res.success) {  
        toast.success("Material entry added ✅");
        reset();
        fetchMaterialsList({ offset: 0, reset: true });
      } else {};
    } catch {
      toast.error("Something went wrong ❌");
    }
  };

  /* =========================
     LIST
  ========================= */
  const LIMIT = 10;
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchMaterialsList = useCallback(
    async (opts: { offset?: number; reset?: boolean } = {}) => {
      const off = opts.offset ?? offset;
      const resetFlag = opts.reset ?? false;

      try {
        if (resetFlag) setLoading(true);

        const res = await postRequest({
          token: "getProjectMaterials",
          data: { project_id: projectId, offset: off, limit: LIMIT },
        });

        if (res.success && Array.isArray(res.data)) {
          setRows((prev) =>
            resetFlag ? res.data : [...prev, ...res.data]
          );
          setOffset(off + res.data.length);
          setHasMore(res.data.length === LIMIT);
        } else {
          if (resetFlag) setRows([]);
          setHasMore(false);
        }
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
          fetchMaterialsList({ offset });
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchMaterialsList, offset, hasMore]
  );

  /* =========================
     INIT
  ========================= */
  useEffect(() => {
    fetchMaterials();
    fetchUnits();
    fetchMaterialsList({ offset: 0, reset: true });
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <FormProvider {...methods}>
      <div className="bg-white p-6 space-y-6">

        {/* FORM */}
        <div className="space-y-4 w-[800px] max-w-full">
          <Row label="Date">
            <FormField type="datepicker" name="date" />
          </Row>

          <Row label="Material">
            <FormField
              type="typeahead"
              name="material_id"
              options={materials}
              disabled={loadingDropdowns}
              validation={{ required: "Material is required" }}
            />
          </Row>

          <Row label="Type">
            <FormField
              type="radio"
              name="transaction_type"
              options={[
                { label: "Request", value: "request" },
                { label: "Received", value: "received" },
                { label: "Used", value: "used" },
              ]}
            />
          </Row>

          <Row label="Quantity">
            <FormField type="input" name="quantity" className="only-numbers" />
          </Row>

          <Row label="Unit">
            <FormField
              type="typeahead"
              name="unit_id"
              options={units}
              validation={{ required: "Unit is required" }}
            />
          </Row>

          <Row label="Remarks">
            <FormField type="input" name="remarks" />
          </Row>

          <div className="flex justify-end">
            <Button onClick={methods.handleSubmit(handleSubmit)}>
              Add Material
            </Button>
          </div>
        </div>

        {/* LIST */}
        <div className="border rounded-lg max-h-[calc(100vh-360px)] overflow-y-auto">
          <table className="table-default w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No material entries found
                  </td>
                </tr>
              )}

              {rows.map((r, i) => {
                const isLast = i === rows.length - 1;
                return (
                  <tr key={r.id} ref={isLast ? lastRowRef : null}>
                    <td>{r.transaction_date}</td>
                    <td>{r.material_name}</td>
                    <td className="capitalize">{r.transaction_type}</td>
                    <td>{r.quantity} {r.unit_name}</td>
                    <td>{r.remarks || "-"}</td>
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

          {!hasMore && rows.length > 0 && (
            <div className="p-3 text-center text-sm text-gray-600">
              No more entries
            </div>
          )}
        </div>

      </div>
    </FormProvider>
  );
}
