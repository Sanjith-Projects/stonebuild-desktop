 'use client';

import "./globals.css";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background  ">

      {/* Card */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-xl border border-border bg-card overflow-hidden">

        {/* LEFT: IMAGE / BRAND */}
        <div className="hidden md:flex items-center justify-center bg-muted relative">
          <Image
            src="/register-image.jpg"
            alt="Register Illustration"
            fill
            className="object-contain p-5"
            priority
          />
        </div>

        {/* RIGHT: FORM */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Create your <span className="text-[#103BB5]">Stonebuilt </span>account
              </h2>
              <p className="text-sm text-muted-foreground">
                Start building with us in just a few steps
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <input
                name="name"
                placeholder="Full name"
                onChange={handleChange}
                className="w-full rounded-lg border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />

              <input
                name="email"
                type="email"
                placeholder="Email address"
                onChange={handleChange}
                className="w-full rounded-lg border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full rounded-lg border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                onChange={handleChange}
                className="w-full rounded-lg border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* CTA */}
            <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
              Create account
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
