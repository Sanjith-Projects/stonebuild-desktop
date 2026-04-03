 "use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { postRequest } from "../utils/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Leads = {
  id: string;
  contact_name: string;
  phone: string;
  address: string;
  pincode: string | number;
  state: string | number;
  created_at: string;
  requirement: string;
};

export default function LeadList() {
  const LIMIT = 10;

  const [leadList, setLeadsList] = useState<Leads[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const didInitialFetchRef = useRef(false);

  const fetchLeadss = useCallback(
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
          token: "getLeads",
          data: { offset: off, limit: lim },
        });

        if (res && res.success && Array.isArray(res.data)) {
          if (resetFlag) {
            setLeadsList(res.data);
            setOffset(off + res.data.length);
            setHasMore(res.data.length === lim);
          } else {
            setLeadsList((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newItems = res.data.filter((r: Leads) => !existingIds.has(r.id));
              const next = [...prev, ...newItems];
              setOffset(off + newItems.length);
              if (typeof res.meta?.has_more === "boolean") {
                setHasMore(res.meta.has_more);
              } else {
                setHasMore(newItems.length === lim);
              }
              return next;
            });
          }
        } else {
          if (resetFlag) setLeadsList([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch leads ❌");
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [offset]
  );

  // initial load (guarded)
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;

    setOffset(0);
    setHasMore(true);
    fetchLeadss({ offset: 0, limit: LIMIT, reset: true });
  }, [fetchLeadss]);

  // Intersection observer callback - when last row visible, fetch next page
  const lastRowRef = useCallback(
    (node: HTMLElement | null) => {
      if (fetchingMore) return;
      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !fetchingMore) {
          fetchLeadss({ offset, limit: LIMIT });
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchLeadss, hasMore, offset, loading, fetchingMore]
  );

  // manual refresh
  const handleRefresh = () => {
    setOffset(0);
    setHasMore(true);
    fetchLeadss({ offset: 0, limit: LIMIT, reset: true });
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={handleRefresh}
          variant="default"
          disabled={loading || fetchingMore}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </Button>
      </div>

      <div className="max-h-[calc(100vh-230px)] overflow-y-auto border rounded-lg">
        <table className="table-default w-full">
          <thead className=" sticky top-0 z-10 bg-white">
            <tr>
              <th className="text-center">S.no</th>
              <th>Leads Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th className="text-center">Pincode</th>
              <th>Requirement</th>
              <th className="text-center">Created At</th>
            </tr>
          </thead>

          <tbody>
            {leadList.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No leads found
                </td>
              </tr>
            )}

            {leadList.map((item, idx) => {
              const isLast = idx === leadList.length - 1;
              return (
                <tr
                  key={`${item.id}-${idx}`}
                  className="border-b"
                  ref={isLast ? lastRowRef : null}
                >
                  <td className="text-center">{idx + 1}</td>
                  <td>{item.contact_name}</td>
                  <td>{item.phone}</td>
                  <td>{item.address}</td>
                  <td className="text-center">{item.pincode || "-"}</td>
                  <td>{item.requirement || "-"}</td>
                  <td className="text-center">{item.created_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Loading indicator for fetching more */}
        {fetchingMore && (
          <div className="p-3 text-center text-sm text-gray-600">Loading more...</div>
        )}

        {/* End message */}
        {!hasMore && leadList.length > 0 && (
          <div className="p-3 text-center text-sm text-gray-600">No more leads</div>
        )}
      </div>
    </div>
  );
}
