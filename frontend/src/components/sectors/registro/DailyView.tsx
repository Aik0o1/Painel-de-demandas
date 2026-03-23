import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiGet } from '@/services/api';

export function DailyView() {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);



    const { data, isLoading } = useQuery({
        queryKey: ['registry-daily', date],
        queryFn: async () => {
            return apiGet(`/registry/stats?type=daily&date=${date}`);
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <span className="text-sm font-medium">Data:</span>
                <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Analista</TableHead>
                            <TableHead>Total Analisado</TableHead>
                            <TableHead>Deferidos</TableHead>
                            <TableHead>Exigências</TableHead>
                            <TableHead>Tempo Médio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Nenhum dado encontrado para esta data.</TableCell>
                            </TableRow>
                        ) : (
                            data?.map((row: any) => (
                                <TableRow key={row._id || row.analyst_name}>
                                    <TableCell className="font-medium">{row.analyst_name}</TableCell>
                                    <TableCell>{row.analyzed_count}</TableCell>
                                    <TableCell className="text-green-600 font-semibold">{row.approved_count}</TableCell>
                                    <TableCell className="text-yellow-600">{row.requirements_count}</TableCell>
                                    <TableCell>{row.avg_time}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
