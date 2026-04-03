// app/[company_id]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CompanyRootRedirect() {
  const router = useRouter();
  const { company_id } = useParams();

  useEffect(() => {
    if (company_id) {
      router.replace(`/${company_id}/app/dashboard`);
    }
  }, [company_id, router]);

  return null; // no content, just redirect
}
