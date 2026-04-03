 "use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";

type Loan = {
  loan_id: string;
  scheme_id: string;
  loan_type: string;
  loan_taken_amount: number;
  interest_percent: number;
  interest_per_month: number;
  application_date: string;
  status: string;
  principal_outstanding: number;
  interest_outstanding: number;
  total_outstanding: number;
  months_elapsed: number;
  loan_category: string;
};

type ContactOutstanding = {
  contact_id: number;
  total_principal: number;
  total_interest: number;
  total_outstanding: number;
  personal_loans: Loan[];
  jewel_loans: Loan[];
};

const Row = ({ label, children }: { label?: string | null; children: React.ReactNode }) => (
  <div className={`flex items-start gap-4 mb-2`}>
    {label ? (
      <>
        <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
        <div className="w-2/3">{children}</div>
      </>
    ) : (
      <div className="w-full">{children}</div>
    )}
  </div>
);

const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  color = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  color?: "blue" | "green" | "red" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-bold">{value}</p>
        {trend && <span className="ml-2 text-sm font-medium opacity-75">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-sm opacity-75">{subtitle}</p>}
    </div>
  );
};

const SimpleBarChart = ({
  data,
  labels,
  height = 200,
}: {
  data: number[];
  labels: string[];
  height?: number;
}) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data);
  const barWidth = 40;
  const spacing = 20;

  return (
    <div className="w-full">
      <svg width="100%" height={height} className="overflow-visible">
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * (height - 40);
          const x = index * (barWidth + spacing) + spacing;
          const y = height - barHeight - 20;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3B82F6"
                rx={4}
                className="transition-all hover:fill-[#2563EB]"
              />
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {labels[index]}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-800 font-medium"
              >
                {value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const StatusPieChart = ({ data }: { data: { status: string; count: number }[] }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];
  let currentAngle = 0;

  if (!total) {
    return <div className="text-center text-gray-500 py-8">No loan status data available</div>;
  }

  return (
    <div className="w-full">
      <svg width="200" height="200" viewBox="0 0 42 42" className="mx-auto">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const angle = (percentage / 100) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;

          const x1 = 21 + 16 * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 21 + 16 * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 21 + 16 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 21 + 16 * Math.sin(((currentAngle + angle) * Math.PI) / 180);

          const pathData = [`M 21 21`, `L ${x1} ${y1}`, `A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(
            " "
          );

          const slice = (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth="0.5"
            />
          );

          currentAngle += angle;
          return slice;
        })}
        <circle cx="21" cy="21" r="8" fill="white" />
      </svg>

      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-gray-600">{item.status}: </span>
            <span className="ml-1 font-medium">{item.count}</span>
            <span className="ml-1 text-gray-500">
              ({((item.count / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [outstanding, setOutstanding] = useState<ContactOutstanding[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async () => {
    setSubmitting(true);
    try {
      const payload = {
        token: "dashboard", // ✅ FIXED TOKEN
      };

      const res = await postRequest(payload);
      console.log("Dashboard Response:", res);

      const list: ContactOutstanding[] = Array.isArray(res?.data) ? res.data : [];
      setOutstanding(list);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalOutstanding = outstanding.reduce((sum, contact) => sum + contact.total_outstanding, 0);
  const totalPrincipal = outstanding.reduce((sum, contact) => sum + contact.total_principal, 0);
  const totalInterest = outstanding.reduce((sum, contact) => sum + contact.total_interest, 0);
  const totalCustomers = outstanding.length;

  const totalLoans = outstanding.reduce(
    (sum, contact) => sum + contact.personal_loans.length + contact.jewel_loans.length,
    0
  );

  const customerOutstandingData = outstanding.slice(0, 5).map((contact) => contact.total_outstanding);
  const customerLabels = outstanding.slice(0, 5).map((contact) => `C${contact.contact_id}`);

  const allLoans = outstanding.flatMap((contact) => [
    ...contact.personal_loans,
    ...contact.jewel_loans,
  ]);

  const statusCounts = allLoans.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  const personalLoansCount = outstanding.reduce(
    (sum, contact) => sum + contact.personal_loans.length,
    0
  );
  const jewelLoansCount = outstanding.reduce((sum, contact) => sum + contact.jewel_loans.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        {submitting && (
          <p className="text-sm text-gray-500 mb-4">
            Loading dashboard data…
          </p>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Total Outstanding"
            value={`₹${totalOutstanding.toLocaleString()}`}
            subtitle="Across all customers"
            color="purple"
          />
          <KPICard
            title="Total Principal"
            value={`₹${totalPrincipal.toLocaleString()}`}
            subtitle="Principal amount outstanding"
            color="blue"
          />
          <KPICard
            title="Total Interest"
            value={`₹${totalInterest.toLocaleString()}`}
            subtitle="Accrued interest"
            color="green"
          />
          <KPICard
            title="Active Customers"
            value={totalCustomers.toString()}
            subtitle={`${totalLoans} total loans`}
            color="red"
          />
        </div>

       
      </div>
    </div>
  );
}
