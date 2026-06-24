import { getDashboardData } from "@/app/actions/seo";
import { ActionPlan } from "@/components/action-plan";
import { PageHeader } from "@/components/page-header";

export default async function ActionPlanPage() {
  const data = await getDashboardData();
  const site = data.status.property
    ?.replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action Plan"
        description={`Top ${Math.min(data.tasks.length, 10)} priority tasks for ${site ?? "your site"}`}
      />
      {data.tasks.length === 0 ? (
        <p className="text-slate-500 text-sm">Connect Search Console to generate your action plan.</p>
      ) : (
        <ActionPlan tasks={data.tasks} site={site} />
      )}
    </div>
  );
}
