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
  assigned_user_ids: string[];
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
    assigned_user_ids: [],
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
        assigned_user_ids: demand.assigned_user_ids || demand.assigned_profiles?.map(u => u.id) || [],
      });
      setDueDate(demand.due_date ? new Date(demand.due_date) : undefined);
    } else {
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        assigned_user_ids: [],
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
                  <SelectContent className="bg-popover border border-border text-popover-foreground">
                    <SelectItem value="low" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Baixa</SelectItem>
                    <SelectItem value="medium" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Média</SelectItem>
                    <SelectItem value="high" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Alta</SelectItem>
                    <SelectItem value="critical" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Crítica</SelectItem>
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
                    <SelectContent className="bg-popover border border-border text-popover-foreground">
                      <SelectItem value="pending" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Pendente</SelectItem>
                      <SelectItem value="in_progress" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Em Progresso</SelectItem>
                      <SelectItem value="completed" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-muted-foreground mb-2 ml-1">Responsáveis</Label>
              {readOnly ? (
                <div className="w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground flex flex-wrap gap-2 min-h-[46px]">
                  {form.assigned_user_ids.length > 0 ? (
                    form.assigned_user_ids.map(id => {
                      const profile = profiles.find(p => p.id === id);
                      return (
                        <div key={id} className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs flex items-center gap-1.5">
                          {profile?.image ? (
                            <img src={profile.image} alt="" className="w-4 h-4 rounded-full" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                              {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          {profile?.full_name || profile?.email || 'Desconhecido'}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground italic">Nenhum atribuído</span>
                  )}
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoadingProfiles}
                      className={cn(
                        "w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all duration-300",
                        "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] min-h-[46px]",
                        form.assigned_user_ids.length === 0 && "text-gray-500"
                      )}
                    >
                      <span className="truncate">
                        {form.assigned_user_ids.length > 0 
                          ? `${form.assigned_user_ids.length} selecionado(s)` 
                          : "Selecione os responsáveis"}
                      </span>
                      {isLoadingProfiles && <Loader2 className="w-4 h-4 animate-spin opacity-50" />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 bg-popover border-border shadow-2xl z-50">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                      {profiles.map((profile) => (
                        <div 
                          key={profile.id} 
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                            form.assigned_user_ids?.includes(profile.id) 
                              ? "bg-primary/20 text-primary" 
                              : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                          )}
                          onClick={() => {
                            const current = form.assigned_user_ids;
                            const next = current.includes(profile.id)
                              ? current.filter(id => id !== profile.id)
                              : [...current, profile.id];
                            setForm({...form, assigned_user_ids: next});
                          }}
                        >
                          <div className={cn(
                            "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                            form.assigned_user_ids.includes(profile.id) 
                              ? "bg-primary border-primary" 
                              : "border-slate-600"
                          )}>
                            {form.assigned_user_ids.includes(profile.id) && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                          <span className="text-sm truncate">{profile.full_name || profile.email}</span>
                        </div>
                      ))}
                      {profiles.length === 0 && !isLoadingProfiles && (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
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
