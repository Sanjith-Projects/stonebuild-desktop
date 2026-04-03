"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = "max-w-2xl",
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-white rounded-xl shadow-xl w-full ${width} mx-4 overflow-hidden`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b px-5 py-3">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className=" max-h-[75vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex justify-end gap-3 border-t px-5 py-3 bg-gray-50">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
