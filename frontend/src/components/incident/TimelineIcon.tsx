import type { TimelineVisualType } from '../../types/incident';

const visualStyles: Record<
  TimelineVisualType,
  { label: string; className: string }
> = {
  EVENT: { label: 'EV', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  INCIDENT: {
    label: 'IN',
    className: 'bg-amber-100 text-amber-800 ring-amber-200',
  },
  WORK_ORDER: {
    label: 'WO',
    className: 'bg-blue-100 text-blue-800 ring-blue-200',
  },
  NOTIFICATION: {
    label: 'NT',
    className: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
};

export function resolveTimelineVisualType(type: string): TimelineVisualType {
  if (type === 'WORK_ORDER_CREATED') {
    return 'WORK_ORDER';
  }

  if (type.startsWith('INCIDENT_') || type === 'NOTIFICATION') {
    return 'NOTIFICATION';
  }

  if (type.startsWith('workflow.flow.')) {
    return 'INCIDENT';
  }

  return 'EVENT';
}

type TimelineIconProps = {
  type: string;
};

export function TimelineIcon({ type }: TimelineIconProps) {
  const visualType = resolveTimelineVisualType(type);
  const style = visualStyles[visualType];

  return (
    <div
      aria-hidden
      className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ${style.className}`}
    >
      {style.label}
    </div>
  );
}
