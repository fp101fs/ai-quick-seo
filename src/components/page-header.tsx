import { InfoTooltip } from "@/components/info-tooltip";

export function PageHeader({
  title,
  description,
  action,
  help,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  help?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {help && <InfoTooltip text={help} side="right" />}
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
