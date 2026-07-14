import { Card } from '../Card';

type IncidentSummaryField = {
  label: string;
  value: string;
};

type IncidentSummaryCardProps = {
  fields: IncidentSummaryField[];
};

export function IncidentSummaryCard({ fields }: IncidentSummaryCardProps) {
  return (
    <Card>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {field.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
