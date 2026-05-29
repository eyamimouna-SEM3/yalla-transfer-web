interface Props {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
}

const StatCard = ({ icon: Icon, label, value, sub, trend }: Props) => (
  <div className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    {(sub || trend) && (
      <p className="text-xs mt-1">
        {trend && <span className="text-green-500 font-medium">{trend} </span>}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </p>
    )}
  </div>
);

export default StatCard;
