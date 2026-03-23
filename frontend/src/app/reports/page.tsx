"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, DollarSign, Users, Briefcase, Scale, Monitor, Calendar, X } from "lucide-react";
import { toast } from "sonner";

import { apiGetBlob } from "@/services/api";

export default function ReportsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleDownload = async (type: string, title: string) => {
        try {
            toast.info(`Gerando relatório de ${title}...`);

            let query = `?type=${type}`;
            if (startDate) query += `&start=${startDate}`;
            if (endDate) query += `&end=${endDate}`;

            const blob = await apiGetBlob(`reports${query}`);

            if (!blob) throw new Error('Falha ao gerar relatório');

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Download de ${title} concluído!`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao baixar relatório. Tente novamente.");
        }
    };

    const reports = [
        {
            id: 'demands',
            title: 'Geral de Demandas',
            description: 'Lista completa de todas as demandas do sistema e seus status.',
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'finance',
            title: 'Financeiro',
            description: 'Extrato de pagamentos, categorias e fornecedores. Colunas detalhadas (Nome, Data, Hora, Valor).',
            icon: DollarSign,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            id: 'registry',
            title: 'Registro Mercantil',
            description: 'Livros, processos e produtividade do setor de registro.',
            icon: Briefcase,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            id: 'ti',
            title: 'Tecnologia (TI)',
            description: 'Histórico de chamados, suporte e inventário técnico.',
            icon: Monitor,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            id: 'employees',
            title: 'Recursos Humanos',
            description: 'Lista de colaboradores e dados administrativos.',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10'
        },
        {
            id: 'communication',
            title: 'Comunicação',
            description: 'Projetos de marketing e demandas semanais.',
            icon: Scale, // Using Scale as placeholder, maybe Megaphone is better but relying on lucide-react basic
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight mb-2">Relatórios</h2>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                            Central de exportação de dados com filtros de período.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/60 shadow-sm">
                        <div className="flex items-center gap-2 border-r border-border/50 px-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">De</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-[13px] focus:ring-0 p-0 h-8 w-28 text-foreground transition-colors"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Até</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-[13px] focus:ring-0 p-0 h-8 w-28 text-foreground transition-colors"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-background/80" 
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            title="Limpar Filtros"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <div key={report.id} className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div className="space-y-4">
                                    <div className={`p-3 w-fit rounded-full ${report.bg}`}>
                                        <report.icon className={`w-6 h-6 ${report.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{report.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-2 gap-2 hover:bg-muted"
                                    onClick={() => handleDownload(report.id, report.title)}
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar CSV
                                    {(startDate || endDate) && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">Filtrado</span>}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
