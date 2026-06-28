"use client";

export function NavigationProgress({ pending }: { pending: boolean }) {
  return (
    <div
      className="pointer-events-none fixed top-0 inset-x-0 z-[200] h-0.5 transition-opacity duration-300"
      style={{ opacity: pending ? 1 : 0 }}
    >
      <div
        className="h-full"
        style={{
          background: "linear-gradient(90deg, #818cf8, #6366f1, #818cf8)",
          backgroundSize: "200% 100%",
          animation: pending ? "nav-shimmer 1.2s linear infinite" : undefined,
        }}
      />
    </div>
  );
}
