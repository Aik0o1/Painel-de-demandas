import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { AnalystProductivityTable } from './AnalystProductivityTable';
import { ProcessFlowGrid } from './ProcessFlowGrid';
import { SlaTimeTable } from './SlaTimeTable';
import { CertificatesBooksGrid } from './CertificatesBooksGrid';
import { SupportPeakGrid } from './SupportPeakGrid';
import { Loader2 } from 'lucide-react';
import { apiGet } from '@/services/api';

export function MonthlyView() {
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());



    const { data, isLoading } = useQuery({
        queryKey: ['registry-monthly', month, year],
        queryFn: async () => {
            return apiGet(`/registry/stats?type=monthly&month=${month}&year=${year}`);
        }
    });

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    // Transform data for companies chart
    const companiesData = data?.active_companies ? [
        { name: 'MEI', value: data.active_companies.mei },
        { name: 'ME', value: data.active_companies.me },
        { name: 'EPP', value: data.active_companies.epp },
        { name: 'Demais', value: data.active_companies.demais },
    ] : [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">

            {/* STICKY HEADER DE CONTROLE */}
            <div className="sticky top-0 z-10 flex gap-4 items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-sm ring-1 ring-border/50">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">📅 Filtro de Período:</span>
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={m.toString()}>
                                {new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[120px] bg-background">
                        <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* LINHA 1: RESUMO DE PROCESSOS */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">1. Fluxo de Processos</h2>
                <ProcessFlowGrid processStats={data?.process_stats} detailedStats={data?.detailed_process_stats} />
            </div>

            {/* LINHA 2: PRODUTIVIDADE DE ANÁLISE */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">2. Produtividade dos Analistas</h2>
                <AnalystProductivityTable data={data?.analyst_stats} requirementsStats={data?.requirements_stats} />
            </div>

            {/* LINHA 3: SLA E TEMPOS */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">3. Tempos Médios de Serviço (SLA)</h2>
                <SlaTimeTable data={data?.sla_stats} generalStats={data?.general_sla_stats} />
            </div>

            {/* LINHA 4: SERVIÇOS ESPECÍFICOS */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">4. Serviços Específicos</h2>
                <CertificatesBooksGrid certificateStats={data?.certificate_stats} bookStats={data?.book_stats} cadastralStats={data?.cadastral_stats} />
            </div>

            {/* LINHA 5: SUPORTE */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">5. Suporte ao Cliente e Picos</h2>
                <SupportPeakGrid supportStats={data?.support_stats} peakHours={data?.peak_hours} />
            </div>

            {/* LINHA 6: GRÁFICOS ESTATÍSTICOS */}
            <div className="border-l-4 border-primary pl-4">
                <h2 className="text-xl font-bold tracking-tight mb-4">6. Ecossistema Empresarial</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Empresas Ativas por Porte</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={companiesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
