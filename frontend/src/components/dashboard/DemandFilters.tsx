import { Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState } from 'react';
import { Profile } from '@/hooks/useProfiles';

interface DemandFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  profiles: Profile[];
  onClearFilters: () => void;
}

export function DemandFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  profiles,
  onClearFilters,
}: DemandFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const hasFilters = search || status !== 'all' || priority !== 'all' || assignee !== 'all' || dateFrom || dateTo;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        Filtros
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center">
        <div className="relative w-full md:w-auto md:flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar demandas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 input-focus w-full"
          />
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="input-focus w-full md:w-[180px] justify-center text-center [&>span]:w-full [&>span]:text-center">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="input-focus w-full md:w-[180px] justify-center text-center [&>span]:w-full [&>span]:text-center">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignee} onValueChange={onAssigneeChange}>
          <SelectTrigger className="input-focus w-full md:w-[200px] justify-center text-center [&>span]:w-full [&>span]:text-center">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Responsáveis</SelectItem>
            <SelectItem value="unassigned">Não atribuído</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 w-full md:w-auto">
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none w-full md:w-[130px] justify-start text-left font-normal input-focus">
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dateFrom ? format(dateFrom, 'MMM d') : 'De'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  onDateFromChange(date);
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none w-full md:w-[130px] justify-start text-left font-normal input-focus">
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dateTo ? format(dateTo, 'MMM d') : 'Até'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  onDateToChange(date);
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
