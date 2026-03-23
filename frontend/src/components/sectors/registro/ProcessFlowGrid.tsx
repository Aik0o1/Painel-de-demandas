import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProcessFlowGrid({ processStats, detailedStats }: { processStats: any, detailedStats: any }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Resumo Geral */}
            <Card>
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium">Fluxo Geral de Processos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Deferimento Automático</TableCell>
                                <TableCell className="text-right">{processStats?.automatico}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-yellow-600">Com Exigência</TableCell>
                                <TableCell className="text-right">{processStats?.exigencia}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-green-600">Deferidos (Humano)</TableCell>
                                <TableCell className="text-right">{processStats?.deferidos}</TableCell>
                            </TableRow>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell>TOTAL GERAL</TableCell>
                                <TableCell className="text-right">
                                    {(processStats?.automatico + processStats?.exigencia + processStats?.deferidos) || 0}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Card 2: Detalhamento Automático */}
            <Card>
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium">Detalhes (Automático)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>Inscrição</TableCell>
                                <TableCell className="text-right">{detailedStats?.automatico?.inscricao || 0}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Alteração</TableCell>
                                <TableCell className="text-right">{detailedStats?.automatico?.alteracao || 0}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Baixa</TableCell>
                                <TableCell className="text-right">{detailedStats?.automatico?.baixa || 0}</TableCell>
                            </TableRow>
                            <TableRow className="bg-muted/50 border-t">
                                <TableCell className="font-semibold text-xs text-muted-foreground uppercase">Total Automático</TableCell>
                                <TableCell className="text-right font-semibold">
                                    {((detailedStats?.automatico?.inscricao || 0) + (detailedStats?.automatico?.alteracao || 0) + (detailedStats?.automatico?.baixa || 0))}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Card 3: Por Porte */}
            <Card className="md:col-span-1">
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium">Movimentação por Porte</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8">Porte</TableHead>
                                <TableHead className="h-8 text-right">Insc</TableHead>
                                <TableHead className="h-8 text-right">Alt</TableHead>
                                <TableHead className="h-8 text-right">Baixa</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detailedStats?.services_by_size && Object.entries(detailedStats.services_by_size).map(([porte, stats]: [string, any]) => (
                                <TableRow key={porte}>
                                    <TableCell className="font-medium uppercase text-xs">{porte}</TableCell>
                                    <TableCell className="text-right text-xs">{stats.inscricao}</TableCell>
                                    <TableCell className="text-right text-xs">{stats.alteracao}</TableCell>
                                    <TableCell className="text-right text-xs">{stats.baixa}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
