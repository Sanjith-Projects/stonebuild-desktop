 "use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { postRequest } from "../utils/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import { FormField } from "../utils/formField";


type Contact = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  bank_name: string;
  state: string | number;
  pincode: string | number;
  address: string;
  created_at: string;
  status : string | number;
  ifsc: string;
};

export default function ContactList() {
  const LIMIT = 10;
const router = useRouter();
 const pathname = usePathname();

  const [contactList, setContactList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  
 const didInitialFetchRef = useRef(false);

  const fetchContacts = useCallback(
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
          token: "getContacts",
          data: { offset: off, limit: lim },
        });

        if (res && res.success && Array.isArray(res.data)) {
          if (resetFlag) {
            setContactList(res.data);
            setOffset(off + res.data.length);
            setHasMore(res.data.length === lim);
          } else {
            setContactList((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newItems = res.data.filter((r: Contact) => !existingIds.has(r.id));
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
          if (resetFlag) setContactList([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch contacts ❌");
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [offset] // you may later move offset to a ref if you want stable identity
  );

  // initial load (guarded)
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;

    setOffset(0);
    setHasMore(true);
    fetchContacts({ offset: 0, limit: LIMIT, reset: true });

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
          // fetch next page using current offset
          fetchContacts({ offset, limit: LIMIT });
        }
      });

      if (node) observer.current.observe(node);
    },
    [fetchContacts, hasMore, offset, loading, fetchingMore]
  );

  // manual refresh
  const handleRefresh = () => {
    setOffset(0);
    setHasMore(true);
    fetchContacts({ offset: 0, limit: LIMIT, reset: true });
  };
  const handleEdit = (id: string) => {
    router.push(`${pathname}?edit-id=${id}`);
  };

  

  const handleStatusToggle = async (contact_id: string, currentStatus: string | number) => {
  const newStatus = Number(currentStatus) === 1 ? 0 : 1;

  const res = await postRequest({
    token: "updateContactStatus",
    data: { contact_id, status: newStatus }
  });

  if (res.success) {
    setContactList(prev =>
      prev.map(item =>
        item.id === contact_id ? { ...item, status: newStatus } : item
      )
    );

    toast.success("Status updated ✔");
  } else {
    toast.error("Failed to update status ❌");
  }
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
          <thead className=" sticky top-0 z-10">
            <tr>
              <th className="text-center">S.no</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th className="text-center">Pincode</th>
              <th>State</th>
              <th>Status</th>
             
              <th className="text-center">Created At</th>
            </tr>
          </thead>

        <tbody>
  {contactList.map((item, idx) => {
    const isLast = idx === contactList.length - 1;

    return (
      <tr
        key={`${item.id}-${idx}`}
        className="border-b"
        ref={isLast ? lastRowRef : null}
      >
        <td className="text-center">{idx + 1}</td>
        <td
          className="cursor-pointer hover:text-[#004345]"
          onClick={() => handleEdit(item.id)}
        >
          {item.full_name}
        </td>
        <td>{item.phone}</td>
        <td>{item.email}</td>
        <td>{item.address}</td>
        <td className="text-center">{item.pincode}</td>
        <td>{item.state}</td>
        <td className="text-center">
  <button
    type="button"
    onClick={() => handleStatusToggle(item.id, item.status)}
    className={`
      relative inline-flex h-5 w-10 items-center rounded-full
      transition-colors duration-300
      ${Number(item.status) === 1 ? "bg-[#103BB5]" : "bg-gray-300"}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
        ${Number(item.status) === 1 ? "translate-x-5" : "translate-x-1"}
      `}
    />
  </button>
</td>

 <td className="text-center">
  {new Date(item.created_at).toLocaleDateString('en-GB')}
</td>
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
        {!hasMore && contactList.length > 0 && (
          <div className="p-3 text-center text-sm text-gray-600">
            No more contacts
          </div>
        )}
      </div>
    </div>
  );
}
