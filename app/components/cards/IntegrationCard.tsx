import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bug, CheckCircle2, MessageSquare, Sheet, Trash2, Workflow, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IIntegration } from "@/lib/types";

const iconMap: Record<string, typeof Sheet> = {
  Sheet,
  Bug,
  MessageSquare,
  Workflow,
};

interface Props {
  integration: IIntegration;
}

const IntegrationCard = ({ integration }: Props) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: integration._id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete integration");
      }
    } catch (error) {
      console.error("Error deleting integration:", error);
      alert("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4 text-brand-mint-ink" />;
      case "expired":
        return <XCircle className="w-4 h-4 text-rose-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-brand-mint/25 text-brand-mint-ink border-brand-mint/50";
      case "expired":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };
  const IconComponent = iconMap[integration.provider] || Sheet;
  return (
    <div key={integration._id} className="bg-highlight border border-line rounded-2xl p-4 hover:border-brand-violet/40 hover:bg-white transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-violet/10 border border-brand-violet/20 rounded-xl flex items-center justify-center shrink-0">
          <IconComponent className="w-4 h-4 text-brand-violet" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h5 className="text-ink font-bold text-sm sm:text-base">@{integration.githubUsername}</h5>
            {integration.label && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
                {integration.label}
              </span>
            )}
            {getStatusIcon(integration.status)}
          </div>
          <p className="text-ink-muted text-xs" suppressHydrationWarning>
            {integration.lastSync
              ? `Last sync: ${formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}`
              : "Never synced yet"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${getStatusColor(integration.status)}`}>
            {integration.status}
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 hover:bg-rose-50 rounded-full text-ink-subtle hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Delete Integration"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;
