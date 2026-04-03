 "use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { postRequest } from "../utils/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Equipment = {
  id: number;
  material_name: string;
  short_code?: string;
  hsn?: string;
  status?: string;
  purchase_date?: string;
  last_service_date?: string;
  next_service_date?: string;
  total_count?: number;
  created_by?: string;
  created_at?: string;
  codes_count?: number;
  codes?: string[];
};

export default function MaterialList() {
  const LIMIT = 10;

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const didInitialFetchRef = useRef(false);

  const fetchEquipments = useCallback(
    async (opts: { offset?: number; limit?: number; reset?: boolean } = {}) => {
      const off = typeof opts.offset === "number" ? opts.offset : offset;
      const lim = opts.limit ?? LIMIT;
      const resetFlag = opts.reset ?? false;

      try {
        if (resetFlag) {
          setLoading(true);
        } else {
          setFetchingMore(true);
        }

        const res = await postRequest({
          token: "getMaterials",
          data: { offset: off, limit: lim },
        });

        if (res && res.success && Array.isArray(res.data)) {
          const returned = res.data as Equipment[];
          // when resetting, replace list
          if (resetFlag) {
            setEquipmentList(returned);
            setOffset(off + returned.length);
            setHasMore(typeof res.meta?.has_more === "boolean" ? res.meta.has_more : returned.length === lim);
          } else {
            setEquipmentList((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newItems = returned.filter((r) => !existingIds.has(r.id));
              const next = [...prev, ...newItems];
              return next;
            });
            // update offset and hasMore after state update
            setOffset((prevOff) => prevOff + returned.length);
            setHasMore(typeof res.meta?.has_more === "boolean" ? res.meta.has_more : returned.length === lim);
          }
        } else {
          if (resetFlag) setEquipmentList([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch equipments ❌");
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    // intentionally do not include `offset` in deps to avoid stale setState loops;
    // we pass offset explicitly when calling (or rely on updated state via setOffset).
    []
  );

  // initial load (guarded)
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;

    setOffset(0);
    setHasMore(true);
    fetchEquipments({ offset: 0, limit: LIMIT, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer callback - when last row visible, fetch next page
  const lastRowRef = useCallback(
    (node: HTMLElement | null) => {
      if (fetchingMore) return;
      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !fetchingMore) {
          // fetch using current offset
          fetchEquipments({ offset, limit: LIMIT });
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchEquipments, hasMore, offset, loading, fetchingMore]
  );

  // manual refresh
  const handleRefresh = () => {
    setOffset(0);
    setHasMore(true);
    fetchEquipments({ offset: 0, limit: LIMIT, reset: true });
  };

 

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handleRefresh} variant="default" disabled={loading || fetchingMore}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </Button>
      </div>

      <div className="max-h-[calc(100vh-230px)] overflow-y-auto border rounded-lg">
        <table className="table-default w-full">
          <thead className=" sticky top-0 z-10 bg-white">
            <tr>
              <th className="text-center">S.no</th>
              <th>Equipment Name</th>
              <th>short_code</th>
              <th>hsn</th>
            
              <th className="text-center">Created At</th>
            </tr>
          </thead>

          <tbody>
            {equipmentList.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No equipments found
                </td>
              </tr>
            )}

            {equipmentList.map((item, idx) => {
              const isLast = idx === equipmentList.length - 1;
              const serial = offset - equipmentList.length + idx + 1; // compute continuous serial based on offset
              // fallback if serial becomes NaN/invalid
              const sNo = Number.isFinite(serial) && serial > 0 ? serial : idx + 1;
              return (
                <tr key={`${item.id}-${idx}`} className="border-b" ref={isLast ? lastRowRef : null}>
                  <td className="text-center">{sNo}</td>
                  <td className="font-medium">{item.material_name}</td>
                  <td>{item.short_code || "-"}</td>
                  <td>{item.hsn || "-"}</td>
                 
                  <td className="text-center">{item.created_at || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Loading indicator for fetching more */}
        {fetchingMore && <div className="p-3 text-center text-sm text-gray-600">Loading more...</div>}

        {/* End message */}
        {!hasMore && equipmentList.length > 0 && <div className="p-3 text-center text-sm text-gray-600">No more equipments</div>}
      </div>
    </div>
  );
}
