"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm text-white animate-fade-in
        ${type === "success" ? "bg-[#1D9E75]" : "bg-red-500"}`}
    >
      <i className={`ti ${type === "success" ? "ti-circle-check" : "ti-alert-circle"}`} />
      {message}
    </div>
  );
}
