import { cn } from '@/lib/utils';
import { DemandPriority } from '@/hooks/useDemands';

interface PriorityBadgeProps {
  priority: DemandPriority;
  className?: string;
}

const priorityConfig = {
  low: {
    label: 'Baixa',
    className: 'bg-success/10 text-success border-success/20',
  },
  medium: {
    label: 'Média',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  high: {
    label: 'Alta',
    className: 'bg-priority-high/10 text-priority-high border-priority-high/20',
  },
  critical: {
    label: 'Crítica',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span className={cn('status-badge border', config.className, className)}>
      <span className={cn('priority-indicator', {
        'bg-success': priority === 'low',
        'bg-warning': priority === 'medium',
        'bg-priority-high': priority === 'high',
        'bg-destructive': priority === 'critical',
      })} />
      {config.label}
    </span>
  );
}
