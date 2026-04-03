"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { postRequest } from "../utils/api";

type HelpForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function HelpPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HelpForm>();

  const onSubmit: SubmitHandler<HelpForm> = async (formData) => {
    try {
      const res = await postRequest({
        token: "submitHelpQuery", // 🔁 change if your backend uses a different token
        data: formData,
      });

      if (res.success) {
        toast.success("Your query has been sent. We'll get back to you soon!");
        reset();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send query");
    }
  };

  return (
    <div className="p-6   mx-auto">
     
      <p className="mb-2 text-sm text-gray-700">
        Welcome to the help center. Here you can find answers to common
        questions and reach out to us if you need more assistance.
      </p>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm space-y-3">
        <h2 className="font-semibold text-base">Common Topics</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>How to manage your subscription and plan.</li>
          <li>Troubleshooting login or access issues.</li>
          <li>Understanding billing cycles and invoices.</li>
          <li>Getting started with your account.</li>
        </ul>

        <p className="text-gray-700">
          If you don&apos;t find what you&apos;re looking for, you can use the
          form below to send us your query. Our team will respond as soon as
          possible.
        </p>
      </div>

      {/* Help Query Form */}
      <h2 className="text-xl font-semibold mb-3">Contact Support</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg"
      >
        <div>
          <Input
            placeholder="Your Name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Input
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Input
            placeholder="Subject"
            {...register("subject", { required: "Subject is required" })}
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <textarea
            placeholder="Describe your issue or question..."
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("message", { required: "Message is required" })}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Query"}
          </Button>
        </div>
      </form>
    </div>
  );
}
