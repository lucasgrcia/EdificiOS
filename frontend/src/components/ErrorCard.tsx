import { Button } from './Button';
import { Card } from './Card';

type ErrorCardProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorCard({ title, description, onRetry }: ErrorCardProps) {
  return (
    <Card
      className="border-red-200 bg-red-50"
      role="alert"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-red-900">{title}</h2>
          <p className="text-sm text-red-800">{description}</p>
        </div>

        {onRetry !== undefined && (
          <Button
            aria-label="Reintentar carga"
            onClick={onRetry}
            variant="secondary"
          >
            Reintentar
          </Button>
        )}
      </div>
    </Card>
  );
}
