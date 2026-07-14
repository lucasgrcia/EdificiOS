import { Card } from '../Card';

type DashboardMetricCardProps = {
  label: string;
  value: number;
};

export function DashboardMetricCard({ label, value }: DashboardMetricCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
        {value}
      </p>
    </Card>
  );
}
