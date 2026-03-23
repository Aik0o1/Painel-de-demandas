import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scroll, Book, UserCog } from "lucide-react";

export function CertificatesBooksGrid({ certificateStats, bookStats, cadastralStats }: { certificateStats: any, bookStats: any, cadastralStats: any[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Coluna 1: Certidões */}
            {/* Coluna 1: Certidões */}
            <Card>
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Scroll className="h-4 w-4" /> Certidões Emitidas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableBody>
                            {[
                                { key: 'simplificada', label: 'Simplificada' },
                                { key: 'inteiro_teor', label: 'Inteiro Teor' },
                                { key: 'especifica', label: 'Específica (Genérica)' },
                                { key: 'especifica_historico', label: 'Histórico de Ato' },
                                { key: 'especifica_societaria_pj', label: 'Part. Societária (PJ)' },
                                { key: 'especifica_linha_tempo', label: 'Linha do Tempo' },
                                { key: 'especifica_livros', label: 'Livros' },
                                { key: 'especifica_leiloeiro', label: 'Matrícula Leiloeiro' },
                                { key: 'especifica_relato', label: 'A Definir Relato' },
                                { key: 'especifica_onus', label: 'Ônus' },
                            ].map((item) => (
                                <TableRow key={item.key}>
                                    <TableCell className="text-xs">{item.label}</TableCell>
                                    <TableCell className="text-right text-xs font-bold">{Number(certificateStats?.[item.key] || 0)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/50">
                                <TableCell className="text-xs font-bold">TOTAL</TableCell>
                                <TableCell className="text-right text-xs font-bold">
                                    {[
                                        'simplificada', 'inteiro_teor', 'especifica',
                                        'especifica_historico', 'especifica_societaria_pj', 'especifica_linha_tempo',
                                        'especifica_livros', 'especifica_leiloeiro', 'especifica_relato', 'especifica_onus'
                                    ].reduce((acc, key) => acc + (Number(certificateStats?.[key]) || 0), 0)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Coluna 2: Livros */}
            <Card>
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Book className="h-4 w-4" /> Análise de Livros
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8 text-xs">Tipo</TableHead>
                                <TableHead className="h-8 text-xs text-right">Analisados</TableHead>
                                <TableHead className="h-8 text-xs text-right">Exigência</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="text-xs font-medium">Digital</TableCell>
                                <TableCell className="text-right text-xs font-bold text-green-700">{bookStats?.digital?.analyzed || 0}</TableCell>
                                <TableCell className="text-right text-xs text-yellow-700">{bookStats?.digital?.requirements || 0}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-xs font-medium">Físico (Legado)</TableCell>
                                <TableCell className="text-right text-xs font-bold text-green-700">{bookStats?.paper?.analyzed || 0}</TableCell>
                                <TableCell className="text-right text-xs text-yellow-700">{bookStats?.paper?.requirements || 0}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Coluna 3: Atualização Cadastral */}
            <Card>
                <CardHeader className="py-3 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UserCog className="h-4 w-4" /> Atualização Cadastral
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8 text-xs">Equipe/Usuário</TableHead>
                                <TableHead className="h-8 text-xs text-right">Atualizadas</TableHead>
                                <TableHead className="h-8 text-xs text-right">Rejeitadas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cadastralStats?.map((stat: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="text-xs font-medium">{stat.analyst_name}</TableCell>
                                    <TableCell className="text-right text-xs font-bold text-blue-700">{stat.updated}</TableCell>
                                    <TableCell className="text-right text-xs text-red-700">{stat.rejected}</TableCell>
                                </TableRow>
                            ))}
                            {(!cadastralStats || cadastralStats.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">Sem dados</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
