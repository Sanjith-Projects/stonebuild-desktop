'use client';

import { useEffect, useState } from "react";

type ToastType = "success" | "error";

export function Toaster({ message, type, onClose }: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md shadow-lg text-sm text-white
      ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {message}
    </div>
  );
}