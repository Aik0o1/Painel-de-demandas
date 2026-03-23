"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RegistryList } from "@/components/sectors/registro/RegistryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalystProductivityTable } from "@/components/sectors/registro/AnalystProductivityTable";
import { CertificatesBooksGrid } from "@/components/sectors/registro/CertificatesBooksGrid";
import { ProcessFlowGrid } from "@/components/sectors/registro/ProcessFlowGrid";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiGetBlob } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const MONTHS = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
];

const YEARS = ["2024", "2025", "2026"];

export default function RegistroPage() {
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("registros");
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            let url = 'registry/report/pdf';
            if (month && year) {
                url += `?month=${month}&year=${year}`;
            }

            const blob = await apiGetBlob(url);
            if (!blob) throw new Error('Falha ao gerar relatório PDF');

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `relatorio-registro-${month}-${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Erro ao baixar PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const { data: statsResponse, isLoading } = useQuery({
        queryKey: ['registry_stats', month, year],
        queryFn: async () => {
            let url = '/registry/stats?type=general';
            if (month && year) {
                url += `&month=${month}&year=${year}`;
            }
            return apiGet(url);
        },
        placeholderData: (previousData) => previousData
    });

    const stats = statsResponse?.data || {};
    const currentPeriod = statsResponse?.data?.period || "Recente";

    // Sync filters with the latest period from backend on initial load
    useEffect(() => {
        if (statsResponse?.data?.period && !month && !year) {
            const [m, y] = statsResponse.data.period.split("-");
            // Remove leading zero for month to match MONTHS value
            const formattedMonth = parseInt(m, 10).toString();
            setMonth(formattedMonth);
            setYear(y);
        }
    }, [statsResponse?.data?.period, month, year]);

    const handleClearFilters = () => {
        setMonth("");
        setYear("");
    };

    const showFilters = activeTab !== "registros";

    return (
        <RoleGuard allowedSectorSlugs={['registro']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight mb-2">Registro</h2>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                                Fluxo de processos, produtividade e livros mercantis.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {showFilters && (
                                <>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Mês" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Ano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map((y) => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {(month || year) && (
                                        <Button variant="ghost" onClick={handleClearFilters} className="text-sm">
                                            Limpar
                                        </Button>
                                    )}
                                    <Button onClick={handleDownloadPDF} disabled={isDownloading} className="ml-2 h-9">
                                        {isDownloading ? "Gerando..." : "Gerar Relatório (PDF)"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="registros">Registros</TabsTrigger>
                            <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
                            <TabsTrigger value="livros">Livros e Certidões</TabsTrigger>
                            <TabsTrigger value="fluxo">Fluxo de Processos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="registros" className="space-y-4">
                            <RegistryList />
                        </TabsContent>

                        <TabsContent value="produtividade" className="space-y-4">
                            {isLoading && !stats?.analyst_stats ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-[200px] w-full" />
                                    <Skeleton className="h-[200px] w-full" />
                                </div>
                            ) : (
                                <AnalystProductivityTable
                                    data={stats?.analyst_stats || []}
                                    requirementsStats={stats?.requirements_stats || []}
                                    timeStats={stats?.analyst_time_stats || []}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="livros" className="space-y-4">
                            {isLoading && !stats?.certificate_stats ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : (
                                <CertificatesBooksGrid
                                    certificateStats={stats?.certificate_stats || {}}
                                    bookStats={stats?.book_stats || {}}
                                    cadastralStats={stats?.cadastral_stats || []}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="fluxo" className="space-y-4">
                            {isLoading && !stats?.process_stats ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : (
                                <ProcessFlowGrid
                                    processStats={stats?.process_stats || {}}
                                    detailedStats={stats?.detailed_process_stats || {}}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
