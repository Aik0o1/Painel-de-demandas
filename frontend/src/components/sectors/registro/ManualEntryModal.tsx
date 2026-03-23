import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save, Edit3 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPost } from '@/services/api';

// --- Type Definitions & Schema ---

// Unified Analyst Schema (Backend splits this into 4 arrays, but UI treats as one row)
const analystSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    // Productivity
    exigencia: z.coerce.number().default(0),
    deferidos: z.coerce.number().default(0),
    total: z.coerce.number().default(0),
    // Requirements Details
    pending_clarification: z.coerce.number().default(0),
    answered: z.coerce.number().default(0),
    // SLA Times (Strings)
    sla_julgamento: z.string().default("00:00:00"),
    sla_autenticacao: z.string().default("00:00:00"),
    sla_arquivamento: z.string().default("00:00:00"),
    // Cadastral
    cadastral_updated: z.coerce.number().default(0),
    cadastral_rejected: z.coerce.number().default(0),
});

// Helper to sum time strings "HH:mm:ss"
function sumTimeStrings(times: string[]) {
    let totalSeconds = 0;
    times.forEach(t => {
        const [h, m, s] = t.split(':').map(Number);
        if (!isNaN(h)) totalSeconds += h * 3600 + (m || 0) * 60 + (s || 0);
    });
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const supportSchema = z.object({
    attendant: z.string().min(1, "Nome obrigatório"),
    calls: z.coerce.number().default(0),
    emails: z.coerce.number().default(0),
    avg_time: z.string().default("00:00:00"),
    total_time: z.string().default("00:00:00")
});

const schema = z.object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2020),
    // Tab 1: Geral & Fluxo
    process_stats: z.object({
        automatico: z.coerce.number().default(0),
        exigencia: z.coerce.number().default(0),
        deferidos: z.coerce.number().default(0),
    }),
    detailed_process_stats: z.object({
        automatico: z.object({
            inscricao: z.coerce.number().default(0),
            alteracao: z.coerce.number().default(0),
            baixa: z.coerce.number().default(0),
        })
    }),
    active_companies: z.object({
        mei: z.coerce.number().default(0),
        me: z.coerce.number().default(0),
        epp: z.coerce.number().default(0),
        demais: z.coerce.number().default(0),
    }),
    // Tab 2: Combined Analysts
    analysts_data: z.array(analystSchema).default([]),

    // Tab 3: Outros
    general_sla_stats: z.object({
        julgamento: z.string().default("00:00:00"),
        autenticacao: z.string().default("00:00:00"),
        arquivamento: z.string().default("00:00:00")
    }),
    support_stats: z.array(supportSchema).default([]),
    certificate_stats: z.object({
        simplificada: z.coerce.number().default(0),
        inteiro_teor: z.coerce.number().default(0),
        especifica: z.coerce.number().default(0),
        especifica_historico: z.coerce.number().default(0),
        especifica_societaria_pj: z.coerce.number().default(0),
        especifica_linha_tempo: z.coerce.number().default(0),
        especifica_livros: z.coerce.number().default(0),
        especifica_leiloeiro: z.coerce.number().default(0),
        especifica_relato: z.coerce.number().default(0),
        especifica_onus: z.coerce.number().default(0),
    }),
    book_stats: z.object({
        digital: z.object({ analyzed: z.coerce.number().default(0), requirements: z.coerce.number().default(0) }),
        paper: z.object({ analyzed: z.coerce.number().default(0), requirements: z.coerce.number().default(0) })
    })
});

type ManualEntryFormValues = z.infer<typeof schema>;

interface ManualEntryModalProps {
    onRefetch?: () => void;
}

export function ManualEntryModal({ onRefetch }: ManualEntryModalProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<ManualEntryFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            process_stats: { automatico: 0, exigencia: 0, deferidos: 0 },
            detailed_process_stats: { automatico: { inscricao: 0, alteracao: 0, baixa: 0 } },
            active_companies: { mei: 0, me: 0, epp: 0, demais: 0 },
            analysts_data: [],
            general_sla_stats: { julgamento: "00:00:00", autenticacao: "00:00:00", arquivamento: "00:00:00" },
            support_stats: [],
            certificate_stats: {
                simplificada: 0, inteiro_teor: 0, especifica: 0,
                especifica_historico: 0, especifica_societaria_pj: 0, especifica_linha_tempo: 0,
                especifica_livros: 0, especifica_leiloeiro: 0, especifica_relato: 0, especifica_onus: 0
            },
            book_stats: { digital: { analyzed: 0, requirements: 0 }, paper: { analyzed: 0, requirements: 0 } }
        }
    });

    const { fields: analystFields, append: appendAnalyst, remove: removeAnalyst } = useFieldArray({
        control: form.control,
        name: "analysts_data"
    });

    const { fields: supportFields, append: appendSupport, remove: removeSupport } = useFieldArray({
        control: form.control,
        name: "support_stats"
    });

    const onSubmit = async (data: ManualEntryFormValues) => {
        // Transform Unified Analyst Data back to Backend Structure
        const payload = {
            ...data,
            analyst_stats: data.analysts_data.map(a => ({ name: a.name, exigencia: a.exigencia, deferidos: a.deferidos, total: a.total })),
            sla_stats: data.analysts_data.map(a => ({ analyst_name: a.name, julgamento: a.sla_julgamento, autenticacao: a.sla_autenticacao, arquivamento: a.sla_arquivamento })),
            requirements_stats: data.analysts_data.map(a => ({ analyst_name: a.name, pending_clarification: a.pending_clarification, answered: a.answered })),
            cadastral_stats: data.analysts_data.map(a => ({ analyst_name: a.name, updated: a.cadastral_updated, rejected: a.cadastral_rejected })),
            // general_sla_stats handling (map object to array if needed, or update backend to accept object)
            // For now, let's assume backend accepts the object structure or valid ignores if we don't map strict.
            // Actually the model expects array [{process_type, avg_time}]. Let's map it.
            general_sla_stats: [
                { process_type: 'Julgamento', avg_time: data.general_sla_stats.julgamento },
                { process_type: 'Autenticação', avg_time: data.general_sla_stats.autenticacao },
                { process_type: 'Arquivamento', avg_time: data.general_sla_stats.arquivamento }
            ]
        };

        // Remove the utility "analysts_data" field before sending
        // @ts-ignore
        delete payload.analysts_data;

        try {
            await apiPost('/registry/manual-entry', payload);

            toast.success("Dados salvos e dashboard atualizado!");
            setOpen(false);
            if (onRefetch) onRefetch();
            queryClient.invalidateQueries({ queryKey: ['registry-stats'] });

        } catch (error) {
            toast.error("Erro ao salvar dados manuais");
            console.error(error);
        }
    };

    const watchAnalysts = form.watch("analysts_data");
    const totalAnalyzed = watchAnalysts?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;

    // Calculate Support Totals for Footer
    const watchSupport = form.watch("support_stats");
    const totalCalls = watchSupport?.reduce((acc, curr) => acc + (Number(curr.calls) || 0), 0) || 0;
    const totalEmails = watchSupport?.reduce((acc, curr) => acc + (Number(curr.emails) || 0), 0) || 0;
    const totalDuration = watchSupport ? sumTimeStrings(watchSupport.map(s => s.total_time)) : "00:00:00";
    // For average of averages, it's safer to just let user interpret or calculate properly if needed.
    // But strictly, we can try to average the times if we convert to seconds.
    // Let's summing Total Time is reliable. Average of Average is tricky without weights.
    // Let's show Total Duration and Sum of Calls/Emails.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Lançamento Manual
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lançamento Manual Completo (PDF Replica)</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Header Control */}
                    <div className="flex gap-4 p-4 bg-muted/40 rounded-lg">
                        <div className="w-32">
                            <Label>Mês</Label>
                            <Input type="number" {...form.register("month")} min={1} max={12} />
                        </div>
                        <div className="w-32">
                            <Label>Ano</Label>
                            <Input type="number" {...form.register("year")} min={2020} />
                        </div>
                    </div>

                    <Tabs defaultValue="geral" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="geral">Resumo, Fluxo e Empresas</TabsTrigger>
                            <TabsTrigger value="produtividade">Analistas (Completo)</TabsTrigger>
                            <TabsTrigger value="livros">Livros & Certidões</TabsTrigger>
                            <TabsTrigger value="suporte">Suporte</TabsTrigger>
                        </TabsList>

                        {/* --- TAB 1: GERAL --- */}
                        <TabsContent value="geral" className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">Fluxo de Processos</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><Label>Automático</Label><Input type="number" {...form.register("process_stats.automatico")} /></div>
                                        <div><Label>Exigências</Label><Input type="number" {...form.register("process_stats.exigencia")} /></div>
                                        <div><Label>Deferidos</Label><Input type="number" {...form.register("process_stats.deferidos")} /></div>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <Label className="text-sm font-medium text-gray-500">Detalhe Automático</Label>
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            <div><Label className="text-xs">Inscrição</Label><Input className="h-8" type="number" {...form.register("detailed_process_stats.automatico.inscricao")} /></div>
                                            <div><Label className="text-xs">Alteração</Label><Input className="h-8" type="number" {...form.register("detailed_process_stats.automatico.alteracao")} /></div>
                                            <div><Label className="text-xs">Baixa</Label><Input className="h-8" type="number" {...form.register("detailed_process_stats.automatico.baixa")} /></div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg">Empresas Ativas (Total)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>MEI</Label><Input type="number" {...form.register("active_companies.mei")} /></div>
                                        <div><Label>ME</Label><Input type="number" {...form.register("active_companies.me")} /></div>
                                        <div><Label>EPP</Label><Input type="number" {...form.register("active_companies.epp")} /></div>
                                        <div><Label>Demais</Label><Input type="number" {...form.register("active_companies.demais")} /></div>
                                    </div>
                                </section>
                            </div>

                            <div className="border p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4">Tempos Médios Globais (Média Geral)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label>Julgamento</Label><Input placeholder="00:00:00" {...form.register("general_sla_stats.julgamento")} /></div>
                                    <div><Label>Autenticação</Label><Input placeholder="00:00:00" {...form.register("general_sla_stats.autenticacao")} /></div>
                                    <div><Label>Arquivamento</Label><Input placeholder="00:00:00" {...form.register("general_sla_stats.arquivamento")} /></div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- TAB 2: PRODUTIVIDADE + SLA + CADASTRO --- */}
                        <TabsContent value="produtividade" className="py-2">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <Label className="text-lg font-bold">Quadro Geral de Analistas</Label>
                                    <p className="text-xs text-muted-foreground">Preencha Produtividade, SLA e Detalhes na mesma linha.</p>
                                </div>
                                <Button type="button" size="sm" onClick={() => appendAnalyst({
                                    name: '',
                                    exigencia: 0,
                                    deferidos: 0,
                                    total: 0,
                                    pending_clarification: 0,
                                    answered: 0,
                                    sla_julgamento: '00:00:00',
                                    sla_autenticacao: '00:00:00',
                                    sla_arquivamento: '00:00:00',
                                    cadastral_updated: 0,
                                    cadastral_rejected: 0
                                })}>
                                    <Plus className="w-4 h-4 mr-2" /> Novo Analista
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-x-auto">
                                <Table className="min-w-[1200px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">Analista</TableHead>
                                            <TableHead className="bg-blue-50 w-24">Exigência</TableHead>
                                            <TableHead className="bg-blue-50 w-24">Deferidos</TableHead>
                                            <TableHead className="bg-blue-100 w-24 border-r">Total</TableHead>

                                            <TableHead className="bg-yellow-50 w-24">Esclarecer</TableHead>
                                            <TableHead className="bg-yellow-50 w-24 border-r">Respondidas</TableHead>

                                            <TableHead className="w-28 text-xs">SLA Julg.</TableHead>
                                            <TableHead className="w-28 text-xs">SLA Aut.</TableHead>
                                            <TableHead className="w-28 text-xs border-r">SLA Arq.</TableHead>

                                            <TableHead className="bg-green-50 w-20 text-xs">Cad. Upd</TableHead>
                                            <TableHead className="bg-red-50 w-20 text-xs text-center border-r">Cad. Rej</TableHead>

                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analystFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <Input className="h-8" {...form.register(`analysts_data.${index}.name`)} placeholder="Nome" />
                                                </TableCell>
                                                <TableCell className="bg-blue-50/30">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.exigencia`)} />
                                                </TableCell>
                                                <TableCell className="bg-blue-50/30">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.deferidos`)} />
                                                </TableCell>
                                                <TableCell className="bg-blue-100/30 border-r">
                                                    <Input className="h-8 font-bold" type="number" {...form.register(`analysts_data.${index}.total`)} />
                                                </TableCell>

                                                <TableCell className="bg-yellow-50/30">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.pending_clarification`)} />
                                                </TableCell>
                                                <TableCell className="bg-yellow-50/30 border-r">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.answered`)} />
                                                </TableCell>

                                                <TableCell>
                                                    <Input className="h-8 text-xs" {...form.register(`analysts_data.${index}.sla_julgamento`)} placeholder="00:00:00" />
                                                </TableCell>
                                                <TableCell>
                                                    <Input className="h-8 text-xs" {...form.register(`analysts_data.${index}.sla_autenticacao`)} placeholder="00:00:00" />
                                                </TableCell>
                                                <TableCell className="border-r">
                                                    <Input className="h-8 text-xs" {...form.register(`analysts_data.${index}.sla_arquivamento`)} placeholder="00:00:00" />
                                                </TableCell>

                                                <TableCell className="bg-green-50/30">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.cadastral_updated`)} />
                                                </TableCell>
                                                <TableCell className="bg-red-50/30 border-r">
                                                    <Input className="h-8" type="number" {...form.register(`analysts_data.${index}.cadastral_rejected`)} />
                                                </TableCell>

                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAnalyst(index)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* --- TAB 3: LIVROS & CERTIDÕES --- */}
                        <TabsContent value="livros" className="py-4 space-y-6">
                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg">Livros (Books)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-medium">Digital</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">Analisados</Label><Input type="number" {...form.register("book_stats.digital.analyzed")} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Exigências</Label><Input type="number" {...form.register("book_stats.digital.requirements")} /></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-medium">Papel (Físico)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">Analisados</Label><Input type="number" {...form.register("book_stats.paper.analyzed")} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Exigências</Label><Input type="number" {...form.register("book_stats.paper.requirements")} /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 border p-4 rounded-lg">
                                    <Label className="mb-2 block text-lg font-semibold">Emissão de Certidões</Label>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Simplificada</Label><Input className="h-8" type="number" {...form.register("certificate_stats.simplificada")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Inteiro Teor</Label><Input className="h-8" type="number" {...form.register("certificate_stats.inteiro_teor")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica (Genérica)</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Histórico de Ato</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_historico")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Part. Societária (PJ)</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_societaria_pj")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Linha do Tempo</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_linha_tempo")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Livros</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_livros")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Matrícula Leiloeiro</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_leiloeiro")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - A Definir Relato</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_relato")} /></div>
                                        <div className="flex items-center gap-2 max-w-sm"><Label className="w-48 text-xs shrink-0">Específica - Ônus</Label><Input className="h-8" type="number" {...form.register("certificate_stats.especifica_onus")} /></div>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        {/* --- TAB 4: SUPORTE --- */}
                        <TabsContent value="suporte" className="py-4">
                            <div className="flex justify-between items-center mb-2">
                                <Label>Atendentes de Suporte</Label>
                                <Button type="button" size="sm" onClick={() => appendSupport({ attendant: '', calls: 0, emails: 0, avg_time: '00:00:00', total_time: '00:00:00' })}>
                                    <Plus className="w-4 h-4 mr-2" /> Nova Linha
                                </Button>
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Atendente</TableHead>
                                            <TableHead className="w-24">Chamadas</TableHead>
                                            <TableHead className="w-24">E-mails</TableHead>
                                            <TableHead className="w-32">Tempo Médio</TableHead>
                                            <TableHead className="w-32">Tempo Total</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {supportFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <Input {...form.register(`support_stats.${index}.attendant`)} placeholder="Nome" />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" {...form.register(`support_stats.${index}.calls`)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" {...form.register(`support_stats.${index}.emails`)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input placeholder="00:00:00" {...form.register(`support_stats.${index}.avg_time`)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input placeholder="00:00:00" {...form.register(`support_stats.${index}.total_time`)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSupport(index)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* FOOTER TOTALS */}
                                        {supportFields.length > 0 && (
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell>TOTAIS</TableCell>
                                                <TableCell>{totalCalls}</TableCell>
                                                <TableCell>{totalEmails}</TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell>{totalDuration}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-8">
                        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="gap-2"><Save className="w-4 h-4" /> Salvar Dados Completo</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

