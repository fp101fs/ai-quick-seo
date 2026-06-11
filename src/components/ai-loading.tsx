import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiLoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AiLoading({
  message = "AI is thinking…",
  className,
  size = "md",
}: AiLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
    >
      <div className="relative">
        {/* Outer pulse rings */}
        <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-30 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-indigo-300 opacity-20 animate-ping [animation-delay:0.3s]" />
        {/* Icon container */}
        <span
          className={cn(
            "relative flex items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-200",
            size === "sm" && "w-10 h-10",
            size === "md" && "w-14 h-14",
            size === "lg" && "w-20 h-20"
          )}
        >
          <Bot
            className={cn(
              "text-white animate-pulse",
              size === "sm" && "w-5 h-5",
              size === "md" && "w-7 h-7",
              size === "lg" && "w-10 h-10"
            )}
          />
        </span>
      </div>
      <div className="text-center space-y-1">
        <p
          className={cn(
            "font-semibold text-slate-700",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg"
          )}
        >
          {message}
        </p>
        <p className="text-xs text-slate-400">This usually takes 5–15 seconds</p>
      </div>
      {/* Animated dots bar */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// Inline variant for inside cards/panels
export function AiLoadingInline({ message = "Analyzing…" }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-4 px-2">
      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 shrink-0">
        <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-40 animate-ping" />
        <Bot className="w-4 h-4 text-white animate-pulse relative" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
