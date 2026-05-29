import { cn } from "@/lib/utils";

interface Props {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const AdminStatCard = ({ icon: Icon, label, value, sub, trend, trendUp = true, className }: Props) => (
  <div className={cn("bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    {(sub || trend) && (
      <p className="text-xs mt-1">
        {trend && (
          <span className={cn("font-medium", trendUp ? "text-green-500" : "text-destructive")}>
            {trend}{" "}
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </p>
    )}
  </div>
);

export default AdminStatCard;
