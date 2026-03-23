import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function SlaTimeTable({ data, generalStats }: { data: any[], generalStats: any[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Tabela Detalhada (Larga) */}
            <div className="lg:col-span-3 rounded-md border bg-card">
                <div className="p-3 border-b bg-muted/40 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Tempos Médios por Analista (SLA)</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-8">Analista</TableHead>
                            <TableHead className="h-8 text-center">Julgamento Singular</TableHead>
                            <TableHead className="h-8 text-center">Autenticação</TableHead>
                            <TableHead className="h-8 text-center">Arquivamento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.map((sla, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                                <TableCell className="font-medium text-xs">{sla.analyst_name}</TableCell>
                                <TableCell className="text-center text-muted-foreground font-mono text-xs">{sla.julgamento}</TableCell>
                                <TableCell className="text-center text-muted-foreground font-mono text-xs">{sla.autenticacao}</TableCell>
                                <TableCell className="text-center text-muted-foreground font-mono text-xs">{sla.arquivamento}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Card de Médias Gerais */}
            <div className="lg:col-span-1">
                <Card className="h-full">
                    <CardHeader className="py-3 bg-muted/20 border-b">
                        <CardTitle className="text-sm font-medium">Médias Gerais do Órgão</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {generalStats?.map((stat: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs font-medium">{stat.process_type}</TableCell>
                                        <TableCell className="text-right text-xs font-mono font-bold">{stat.avg_time}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
