"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

export function VideoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <span className="flex w-8 h-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 ml-0.5" />
        </span>
        Watch demo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-[340px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-9 right-0 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/HKKp5d8LvaY?autoplay=1"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full aspect-[9/16] rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
