 'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

     

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 space-y-6">

        <h2 className="text-4xl font-bold max-w-2xl">
          Manage Your Construction Business in One Place
        </h2>

        <p className="text-muted-foreground max-w-xl">
          Projects, expenses, parties, and reports — everything your site needs,
          simplified.
        </p>

        <div className="flex gap-4">
          <Link href="/register">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm">
              Register
            </button>
          </Link>

          <Link href="/login">
            <button className="px-6 py-3 border rounded-lg text-sm">
              Login
            </button>
          </Link>
        </div>

      </section>

      {/* FEATURES */}
      <section className="grid md:grid-cols-3 gap-6 px-6 pb-20 max-w-6xl mx-auto">

        <div className="border rounded-lg p-5">
          <h3 className="font-semibold">Project Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track all your construction projects in one place.
          </p>
        </div>

        <div className="border rounded-lg p-5">
          <h3 className="font-semibold">Expense Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor spending and control budgets easily.
          </p>
        </div>

        <div className="border rounded-lg p-5">
          <h3 className="font-semibold">Party Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage clients, vendors, and contractors.
          </p>
        </div>

      </section>

    </div>
  );
}