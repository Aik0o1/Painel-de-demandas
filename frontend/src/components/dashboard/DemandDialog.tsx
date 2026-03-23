import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DemandPriority, DemandStatus, DemandWithProfiles } from '@/hooks/useDemands';
import { Profile } from '@/hooks/useProfiles';
import { FuturisticModal, FuturisticInput, FuturisticTextarea, FuturisticButton } from '@/components/ui/futuristic-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand?: DemandWithProfiles | null;
  profiles: Profile[];
  onSubmit: (data: DemandFormData) => void;
  isLoading: boolean;
  isLoadingProfiles?: boolean;
  readOnly?: boolean;
}

export interface DemandFormData {
  title: string;
  description: string;
  priority: DemandPriority;
  status?: DemandStatus;
  assigned_to?: string;
  due_date?: string;
}

export function DemandDialog({
  open,
  onOpenChange,
  demand,
  profiles,
  onSubmit,
  isLoading,
  isLoadingProfiles,
  readOnly = false,
}: DemandDialogProps) {
  const [form, setForm] = useState<DemandFormData>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (demand) {
      setForm({
        title: demand.title,
        description: demand.description || '',
        priority: demand.priority,
        status: demand.status,
        assigned_to: demand.assigned_to || undefined,
      });
      setDueDate(demand.due_date ? new Date(demand.due_date) : undefined);
    } else {
      setForm({
        title: '',
        description: '',
        priority: 'medium',
      });
      setDueDate(undefined);
    }
  }, [demand, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    onSubmit({
      ...form,
      due_date: dueDate?.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FuturisticModal title={readOnly ? 'Visualizar Demanda' : (demand ? 'Editar Demanda' : 'Nova Demanda')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Título *</Label>
            {readOnly ? (
              <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground">
                {form.title}
              </div>
            ) : (
              <FuturisticInput
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Digite o título da demanda"
                required
              />
            )}
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Descrição</Label>
            {readOnly ? (
              <div className="min-h-[100px] w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground whitespace-pre-wrap">
                {form.description || <span className="text-muted-foreground italic">Sem descrição</span>}
              </div>
            ) : (
              <FuturisticTextarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Digite a descrição da demanda"
                className="min-h-[100px]"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">


            <div className="space-y-2 group">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Prioridade</Label>
              {readOnly ? (
                <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground">
                  {form.priority === 'low' && 'Baixa'}
                  {form.priority === 'medium' && 'Média'}
                  {form.priority === 'high' && 'Alta'}
                  {form.priority === 'critical' && 'Crítica'}
                </div>
              ) : (
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value as DemandPriority })}
                >
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-auto">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0b14] border border-slate-800 text-foreground">
                    <SelectItem value="low" className="focus:bg-muted focus:text-foreground cursor-pointer">Baixa</SelectItem>
                    <SelectItem value="medium" className="focus:bg-muted focus:text-foreground cursor-pointer">Média</SelectItem>
                    <SelectItem value="high" className="focus:bg-muted focus:text-foreground cursor-pointer">Alta</SelectItem>
                    <SelectItem value="critical" className="focus:bg-muted focus:text-foreground cursor-pointer">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {demand && (
              <div className="space-y-2 group">
                <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Status</Label>
                {readOnly ? (
                  <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground">
                    {form.status === 'pending' && 'Pendente'}
                    {form.status === 'in_progress' && 'Em Progresso'}
                    {form.status === 'completed' && 'Concluído'}
                    {!form.status && '-'}
                  </div>
                ) : (
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm({ ...form, status: value as DemandStatus })}
                  >
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-auto">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0b14] border border-slate-800 text-foreground">
                      <SelectItem value="pending" className="focus:bg-muted focus:text-foreground cursor-pointer">Pendente</SelectItem>
                      <SelectItem value="in_progress" className="focus:bg-muted focus:text-foreground cursor-pointer">Em Progresso</SelectItem>
                      <SelectItem value="completed" className="focus:bg-muted focus:text-foreground cursor-pointer">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Responsável</Label>
              {readOnly ? (
                <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground">
                  {form.assigned_to
                    ? profiles.find(p => p.id === form.assigned_to)?.full_name ||
                    profiles.find(p => p.id === form.assigned_to)?.email ||
                    'Desconhecido'
                    : 'Não atribuído'}
                </div>
              ) : (
                <Select
                  value={form.assigned_to || 'unassigned'}
                  onValueChange={(value) => setForm({
                    ...form,
                    assigned_to: value === 'unassigned' ? undefined : value
                  })}
                  disabled={isLoadingProfiles}
                >
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-auto">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0b14] border border-slate-800 text-foreground">
                    <SelectItem value="unassigned" className="focus:bg-muted focus:text-foreground cursor-pointer">Não atribuído</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id} className="focus:bg-muted focus:text-foreground cursor-pointer">
                        {profile.full_name || profile.email}
                      </SelectItem>
                    ))}
                    {!isLoadingProfiles && profiles.length === 0 && (
                      <SelectItem value="no_users" disabled className="text-slate-500">Nenhum usuário encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2 group">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Prazo</Label>
              {/* Date Picker - Reusing shadcn popover but styling trigger */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={readOnly}
                    className={cn(
                      "w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2 transition-all duration-300",
                      !readOnly && "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                      !dueDate && "text-gray-500 dark:text-muted-foreground",
                      dueDate ? "text-gray-900 dark:text-foreground" : ""
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {dueDate ? format(dueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : (readOnly ? 'Sem prazo' : 'Selecione uma data')}
                  </button>
                </PopoverTrigger>
                {!readOnly && (
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </div>

          {readOnly && demand?.created_at && (
            <div className="space-y-2 group">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Criado em</Label>
              <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 opacity-50" />
                {format(new Date(demand.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 gap-3">
            {/* We can use standard buttons for cancel/close or custom ones. Using custom for primary action */}
            {!readOnly && (
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700 dark:text-muted-foreground dark:hover:text-white">
                Cancelar
              </Button>
            )}
            {readOnly ? (
              <FuturisticButton type="button" onClick={() => onOpenChange(false)}>
                Fechar
              </FuturisticButton>
            ) : (
              <FuturisticButton type="submit" isLoading={isLoading}>
                {demand ? 'Atualizar' : 'Registrar'}
              </FuturisticButton>
            )}
          </div>
        </form>
      </FuturisticModal>
    </Dialog>
  );
}
