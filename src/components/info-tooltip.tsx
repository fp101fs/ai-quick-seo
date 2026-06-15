"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";

export function InfoTooltip({
  text,
  side = "top",
}: {
  text: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  const arrowClass = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent",
  }[side];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="More information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div role="tooltip" className={`absolute z-50 w-56 ${positionClass} pointer-events-none`}>
          <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-lg">
            {text}
          </div>
          <span className={`absolute w-0 h-0 border-4 ${arrowClass}`} />
        </div>
      )}
    </div>
  );
}
