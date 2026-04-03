 "use client";
import React from "react";

interface BigModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BigModal({ open, onClose, title, children }: BigModalProps) {
  if (!open) return null;

  return (
     <div
      className="fixed inset-0 bg-black/40 z-[40] flex justify-center"
      onClick={onClose}
    >
      {/* 🔹 Modal with 20px gap top & bottom */}
      <div
        className=" bg-white rounded-xl shadow-2xl 
    w-[95vw] max-w-[1600px]
    max-h-[calc(100vh-40px)]
    my-5 
    flex flex-col 
    overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (title) – does not scroll */}
        <div className="p-4 border-b bg-gray-50 shrink-0">
          <h2 className="text-xl font-semibold truncate">Project Name : {title}</h2>
        </div>

        {/* Content wrapper – fills remaining height */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
