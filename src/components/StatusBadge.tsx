import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type DocumentStatus = "Pending" | "In Progress" | "Completed" | "Returned";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "Pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          className: "bg-warning/10 text-warning hover:bg-warning/20",
        };
      case "In Progress":
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          className: "bg-info/10 text-info hover:bg-info/20",
        };
      case "Completed":
        return {
          variant: "secondary" as const,
          icon: CheckCircle2,
          className: "bg-success/10 text-success hover:bg-success/20",
        };
      case "Returned":
        return {
          variant: "secondary" as const,
          icon: XCircle,
          className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        };
      default:
        return {
          variant: "secondary" as const,
          icon: Clock,
          className: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};
