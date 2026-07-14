"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/services/api";

export function ReportUpload() {
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Selecione uma planilha antes de enviar.");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("month", month);
            formData.append("year", year);
            return apiPost("/admin/reports/upload", formData);
        },
        onSuccess: (result: any) => {
            toast.success(`Relatório de ${result.mes_referencia}/${year} salvo com sucesso!`);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            queryClient.invalidateQueries({ queryKey: ['registry-monthly'] });
            queryClient.invalidateQueries({ queryKey: ['registry-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao enviar a planilha");
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Relatórios de Produtividade</h2>
                <p className="text-sm text-muted-foreground">
                    Envie a planilha mensal (.xlsx) para converter e salvar automaticamente os dados do relatório.
                </p>
            </div>

            <Card className="border border-border/50 bg-card max-w-xl">
                <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês de referência</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-full">
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
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ano</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planilha (.xlsx)</Label>
                        <label className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border/60 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                            <UploadCloud className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">
                                {file ? file.name : "Clique para selecionar o arquivo .xlsx"}
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Se já existir um relatório salvo para o mês/ano selecionado, ele será substituído pelo novo envio.
                    </p>

                    <Button
                        className="w-full gap-2"
                        disabled={!file || uploadMutation.isPending}
                        onClick={() => uploadMutation.mutate()}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="h-4 w-4" /> Enviar e gerar relatório
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
