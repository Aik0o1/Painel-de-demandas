import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { DemandWithProfiles, DemandStatus } from '@/hooks/useDemands';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DemandTableProps {
  demands: DemandWithProfiles[];
  onEdit: (demand: DemandWithProfiles) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: DemandStatus) => void;
  onView: (demand: DemandWithProfiles) => void;
}

export function DemandTable({ demands, onEdit, onDelete, onStatusChange, onView }: DemandTableProps) {
  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const isOverdue = (dueDate: string | null, status: DemandStatus) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (demands.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma demanda encontrada</h3>
        <p className="text-muted-foreground">Crie sua primeira demanda para começar</p>
      </div>
    );
  }

  return (

    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[300px]">Demanda</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demands.map((demand) => (
              <TableRow key={demand.id} className="table-row-hover border-border/50">
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{demand.title}</p>
                    {demand.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {demand.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={demand.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={demand.priority} />
                </TableCell>
                <TableCell>
                  {demand.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(demand.assignee.full_name, demand.assignee.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm whitespace-nowrap">
                        {demand.assignee.full_name || demand.assignee.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell>
                  {demand.due_date ? (
                    <div className={cn(
                      'flex items-center gap-1.5 text-sm whitespace-nowrap',
                      isOverdue(demand.due_date, demand.status) && 'text-destructive'
                    )}>
                      {isOverdue(demand.due_date, demand.status) && (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {demand.due_date && !isNaN(new Date(demand.due_date).getTime())
                        ? format(new Date(demand.due_date), "d 'de' MMM, yyyy", { locale: ptBR })
                        : "Data inválida"}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Sem prazo</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {demand.created_at && !isNaN(new Date(demand.created_at).getTime())
                      ? format(new Date(demand.created_at), "d 'de' MMM, yyyy", { locale: ptBR })
                      : "Duração não disponível"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => onView(demand)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(demand)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {demand.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => onStatusChange(demand.id, 'completed')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como Concluído
                          </DropdownMenuItem>
                        )}
                        {demand.status !== 'in_progress' && (
                          <DropdownMenuItem onClick={() => onStatusChange(demand.id, 'in_progress')}>
                            <Clock className="w-4 h-4 mr-2" />
                            Marcar em Progresso
                          </DropdownMenuItem>
                        )}
                        {demand.status !== 'pending' && (
                          <DropdownMenuItem onClick={() => onStatusChange(demand.id, 'pending')}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Marcar como Pendente
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(demand.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
