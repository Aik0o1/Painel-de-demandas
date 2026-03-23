import { cn } from '@/lib/utils';
import { DemandStatus } from '@/hooks/useDemands';

interface StatusBadgeProps {
  status: DemandStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  in_progress: {
    label: 'Em Progresso',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-success/10 text-success border-success/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('status-badge border', config.className, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-warning': status === 'pending',
        'bg-primary': status === 'in_progress',
        'bg-success': status === 'completed',
      })} />
      {config.label}
    </span>
  );
}
