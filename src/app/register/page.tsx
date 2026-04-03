 'use client';

import "./../globals.css";
import Link from "next/link";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/formField";
import { apiRequest } from "@/lib/api";
 
import { useUI } from "@/providers/ui-provider";

export default function RegisterPage() {

 


const { showLoader, hideLoader, showToast } = useUI();
  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      contact_name: "",
      phone: "",
      company_name: "",
      gst: "",
      address: "",
      plan: "Starter",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const terms = watch("terms");

 const onSubmit = async (data: any) => {
  try {
    showLoader();

    const res = await apiRequest({
      url: "/signup",
      data,
    });

    showToast("Registered successfully!", "success");

  } catch (err: any) {
    showToast(err.message || "Something went wrong", "error");
  } finally {
    hideLoader();
  }
};

  const isValid = password && password === confirmPassword && terms;

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-xl border border-border bg-card overflow-hidden">

        {/* LEFT */}
        <div className="hidden md:flex items-center justify-center bg-muted relative">
          <Image
            src="/register-image.jpg"
            alt="Register"
            fill
            className="object-contain p-5"
          />
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md space-y-6"
          >

            <div>
              <h2 className="text-2xl font-semibold">
                Create your <span className="text-[#103BB5]">Stonebuilt</span> account
              </h2>
              <p className="text-sm text-muted-foreground">
                Start managing your construction business
              </p>
            </div>

            <div className="space-y-4">

              <FormField name="contact_name" control={control} placeholder="Contact Name" />

              <FormField name="phone" control={control} placeholder="Phone Number" />

              <FormField name="company_name" control={control} placeholder="Company Name" />

              <FormField name="gst" control={control} placeholder="GST Number" />

              {/* ADDRESS */}
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Address"
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              />

              {/* PLAN */}
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Plan</p>

                    <div className="flex gap-4">
                      {["Starter", "Growth", "Pro"].map((plan) => (
                        <label key={plan} className="flex items-center gap-2">
                          <Input
                            type="radio"
                            value={plan}
                            checked={field.value === plan}
                            onChange={() => field.onChange(plan)}
                          />
                          {plan}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              />

              <FormField name="password" control={control} type="password" placeholder="Password" />

              <FormField name="confirmPassword" control={control} type="password" placeholder="Confirm Password" />

              {/* TERMS */}
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    I agree to Terms & Conditions
                  </label>
                )}
              />

            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Create account
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
  
}