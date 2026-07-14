type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
    />
  );
}

type SkeletonCardProps = {
  lines?: number;
};

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando contenido"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <Skeleton className="mb-4 h-4 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}

type SkeletonListProps = {
  items?: number;
};

export function SkeletonList({ items = 4 }: SkeletonListProps) {
  return (
    <div aria-busy="true" aria-label="Cargando lista" className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

type SkeletonTimelineProps = {
  items?: number;
};

export function SkeletonTimeline({ items = 4 }: SkeletonTimelineProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando timeline"
      className="ml-2 space-y-8 border-l border-slate-200 pl-8"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="relative space-y-2">
          <Skeleton className="absolute -left-[2.35rem] h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando métricas"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <Skeleton className="mb-3 h-3 w-2/3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
