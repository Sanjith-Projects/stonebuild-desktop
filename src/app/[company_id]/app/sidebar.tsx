 "use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  Gem,
  Wallet,
  BookOpen,
  ShoppingBag,
  BarChart2,
  BellRing,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const primary = "text-[#103BB5]";
const primaryHover = "hover:bg-[#103BB5]/10";

export default function Sidebar({ onMenuChange }: { onMenuChange: (label: string) => void }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [activeMenu, setActiveMenu] = useState("");

  // Menu mapping (must match the routes used in MenuItem / MenuWithSub)
  const menuMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/contacts": "Contacts",
    "/materials": "Materials",
    "/equipments": "Equipments",
    "/warehouse": "Warehouse",
    "/ledger": "Ledger",
    "/purchase": "Purchase",
    "/transaction/expense": "Expense",

    // NEW MAIN MENUS
    "/attendance": "Attendance",
    "/payroll": "Payroll",
    "/quotation": "Quotation",
    "/crm": "CRM",

    // REPORTS
    "/reports/stocks": "Stocks",
    "/reports/day-book": "Day Book",
    "/reports/cash-book": "Cash Book",
    "/reports/statement": "Statement",
    "/reports/outstanding": "Outstanding",
    "/reports/payments": "Payments",
    "/reports/receipts": "Receipts",
    "/reports/expenses": "Expenses",
    "/reports/attendance": "Attendance",
    "/reports/salary": "Salary",
    "/reports/dpr": "Daily Progress Report",
"/help": "Help & Support",

    "/reminders": "Reminders",
    "/settings": "Settings",
    "/project": "Project",
  };

  const normalizePath = (path: string) => {
    if (!path) return "/";
    let cleaned = path.split("?")[0].split("#")[0];
    if (cleaned.length > 1 && cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1);

    const parts = cleaned.split("/").filter(Boolean); // removes empty strings

    // pattern: /:companyId/app/....
    if (parts.length >= 2 && !isNaN(Number(parts[0])) && parts[1] === "app") {
      const remainder = parts.slice(2).join("/");
      return "/" + (remainder || "");
    }

    // pattern: /app/...
    if (parts.length >= 1 && parts[0] === "app") {
      const remainder = parts.slice(1).join("/");
      return "/" + (remainder || "");
    }

    return cleaned.startsWith("/") ? cleaned : "/" + cleaned;
  };

  const normalizedPath = useMemo(() => normalizePath(pathname), [pathname]);

  const findBestMatchLabel = (normPath: string) => {
    if (menuMap[normPath]) return menuMap[normPath];

    const candidates = Object.keys(menuMap).filter(
      (key) =>
        normPath === key ||
        normPath.startsWith(key + "/") ||
        normPath.startsWith(key)
    );

    if (candidates.length === 0) return undefined;

    candidates.sort((a, b) => b.length - a.length);
    return menuMap[candidates[0]];
  };

  useEffect(() => {
    const label = findBestMatchLabel(normalizedPath);
    if (label) {
      setActiveMenu(label);
      onMenuChange(label);
    } else {
      setActiveMenu("");
      onMenuChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPath]);

  const handleMenuClick = (label: string, route: string) => {
    setActiveMenu(label);
    onMenuChange(label);

    const parts = (pathname || "/").split("/").filter(Boolean);
    const companyId = parts.length >= 1 && !isNaN(Number(parts[0])) ? parts[0] : null;

    const base = companyId ? `/${companyId}/app` : `/app`;
    const routePath = route.startsWith("/") ? route : `/${route}`;
    router.push(`${base}${routePath}`);
  };

  return (
    <aside className="flex-shrink-0 w-[260px] h-screen bg-gray-50 px-4 pb-4 flex flex-col overflow-y-auto">
      <h1 className="flex items-center pb-2 text-2xl font-bold text-[#103BB5]">
        <img src="/stonebuild-logo.png" alt="stonebuild Logo" className="w-20 h-20" />
        <span className="text-[#103BB5]">Stonebuild</span>
      </h1>

      <nav className="flex-1 pr-1 text-sm space-y-1">
        {/* Dashboard */}
        <MenuItem
          icon={<Home size={18} />}
          label="Dashboard"
          route="/dashboard"
          active={activeMenu === "Dashboard"}
          onClick={handleMenuClick}
        />

        {/* Essentials */}
        <MenuWithSub
          icon={<Users size={18} />}
          label="Essentials"
          items={[
            { name: "Contacts", route: "/contacts" },
            { name: "Materials", route: "/materials" },
            { name: "Equipments", route: "/equipments" },
            { name: "Warehouse", route: "/warehouse" },
          ]}
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
          normalizedPath={normalizedPath}
        />

        {/* Ledger */}
        <MenuItem
          icon={<BookOpen size={18} />}
          label="Ledger"
          route="/ledger"
          active={activeMenu === "Ledger"}
          onClick={handleMenuClick}
        />

        {/* Project */}
        <MenuItem
          icon={<BookOpen size={18} />}
          label="Project"
          route="/project"
          active={activeMenu === "Project"}
          onClick={handleMenuClick}
        />

        {/* Purchase */}
        <MenuItem
          icon={<BookOpen size={18} />}
          label="Purchase"
          route="/purchase"
          active={activeMenu === "Purchase"}
          onClick={handleMenuClick}
        />

        {/* Expense (Transaction) */}
        <MenuItem
          icon={<ShoppingBag size={18} />}
          label="Expense"
          route="/transaction/expense"
          active={activeMenu === "Expense"}
          onClick={handleMenuClick}
        />

        {/* NEW: Quotation */}
        <MenuItem
          icon={<Gem size={18} />}
          label="Quotation"
          route="/quotation"
          active={activeMenu === "Quotation"}
          onClick={handleMenuClick}
        />

        {/* NEW: CRM */}
        <MenuItem
          icon={<Users size={18} />}
          label="CRM"
          route="/crm"
          active={activeMenu === "CRM"}
          onClick={handleMenuClick}
        />

        {/* Attendance */}
        <MenuItem
          icon={<BellRing size={18} />}
          label="Attendance"
          route="/attendance"
          active={activeMenu === "Attendance"}
          onClick={handleMenuClick}
        />

        {/* Payroll */}
        <MenuItem
          icon={<Wallet size={18} />}
          label="Payroll"
          route="/payroll"
          active={activeMenu === "Payroll"}
          onClick={handleMenuClick}
        />

        {/* REPORTS MAIN MENU */}
        <MenuWithSub
          icon={<BarChart2 size={18} />}
          label="Reports"
          items={[
            { name: "DPR", route: "/reports/dpr" },
            { name: "Stocks", route: "/reports/stocks" },
            { name: "Day Book", route: "/reports/day-book" },
            { name: "Cash Book", route: "/reports/cash-book" },
            { name: "Statement", route: "/reports/statement" },
            { name: "Outstanding", route: "/reports/outstanding" },
            { name: "Payments", route: "/reports/payments" },
            { name: "Receipts", route: "/reports/receipts" },
            { name: "Expenses", route: "/reports/expenses" },
            { name: "Attendance", route: "/reports/attendance" },
            { name: "Salary", route: "/reports/salary" },
          ]}
          activeMenu={activeMenu}
          onMenuClick={handleMenuClick}
          normalizedPath={normalizedPath}
        />
       

{/* Help */}
<MenuItem
  icon={<BookOpen size={18} />}   // You can change the icon
  label="Help"
  route="/help"
  active={activeMenu === "Help"}
  onClick={handleMenuClick}
/>

      </nav>
    </aside>
  );
}

function MenuItem({
  icon,
  label,
  route,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  route: string;
  active?: boolean;
  onClick: (label: string, route: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(label, route)}
      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-[17px] relative
    ${
      active
        ? "bg-[#103BB5]/10 text-[#103BB5] font-semibold after:content-[''] after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-[#103BB5] after:rounded-r"
        : "text-gray-700 hover:bg-gray-100 hover:text-[#103BB5]"
    }
    transition-all duration-200
  `}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuWithSub({
  icon,
  label,
  items,
  activeMenu,
  onMenuClick,
  normalizedPath,
}: any) {
  const [open, setOpen] = useState(false);

  // open if any child route matches the current normalized path
  useEffect(() => {
    if (!normalizedPath) return;
    const matched = items.some((item: any) => {
      const r = item.route;
      return (
        normalizedPath === r ||
        normalizedPath.startsWith(r + "/") ||
        normalizedPath.startsWith(r)
      );
    });
    setOpen(matched);
  }, [normalizedPath, items]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-2 rounded font-medium text-[17px]
          ${items.some((item: any) => activeMenu === item.name) ? "text-[#103BB5]" : "text-gray-700"}
          ${primaryHover} transition-colors`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        {open ? (
          <ChevronDown size={16} className={primary} />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>

      {open && (
        <div className="flex flex-col mt-1">
          {items.map((item: any) => (
            <button
              key={item.name}
              onClick={() => onMenuClick(item.name, item.route)}
              className={`text-left flex items-center gap-2 px-3 py-2 ml-6 rounded-lg text-[16.5px] relative
    ${
      activeMenu === item.name
        ? "bg-[#103BB5]/10 text-[#103BB5] font-semibold after:content-[''] after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-[#103BB5] after:rounded-r"
        : "text-gray-700 hover:bg-gray-100 hover:text-[#103BB5]"
    }
    transition-all duration-200
  `}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
