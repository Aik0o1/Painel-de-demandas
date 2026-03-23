import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
    LabelList
} from 'recharts';

export function AnalystProductivityTable({
    data,
    requirementsStats,
    timeStats = []
}: {
    data: any[],
    requirementsStats: any[],
    timeStats?: any[]
}) {
    const totalExigencia = data?.reduce((acc, curr) => acc + curr.exigencia, 0) || 0;
    const totalDeferidos = data?.reduce((acc, curr) => acc + curr.deferidos, 0) || 0;
    const totalGeral = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;

    // Colores consistentes con la identidad visual
    const COLORS = {
        exigencia: "#f59e0b", // Amber/Yellow
        deferidos: "#10b981",  // Emerald/Green
        primary: "#034ea2"
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Seção Principal (Gráfico/Tabela) */}
                <div className="lg:col-span-3 rounded-md border bg-card">
                    <Tabs defaultValue="tabela" className="w-full">
                        <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                            <h3 className="font-semibold text-sm">Produtividade Individual dos Analistas</h3>
                            <TabsList className="h-8 p-1">
                                <TabsTrigger value="tabela" className="text-xs px-2 h-6">Tabela</TabsTrigger>
                                <TabsTrigger value="grafico" className="text-xs px-2 h-6">Gráfico</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="tabela" className="m-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8">Analista</TableHead>
                                        <TableHead className="h-8 text-center">Exigências</TableHead>
                                        <TableHead className="h-8 text-center">Deferidos</TableHead>
                                        <TableHead className="h-8 text-right">Total Produzido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.map((analyst, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell className="flex items-center gap-2 py-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">{analyst.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-xs">{analyst.name}</span>
                                            </TableCell>
                                            <TableCell className="text-center text-xs py-2">{analyst.exigencia}</TableCell>
                                            <TableCell className="text-center font-medium text-green-600 text-xs py-2">{analyst.deferidos}</TableCell>
                                            <TableCell className="text-right font-bold text-xs py-2">{analyst.total}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted/50 font-bold text-xs">
                                        <TableCell>TOTAL</TableCell>
                                        <TableCell className="text-center">{totalExigencia}</TableCell>
                                        <TableCell className="text-center">{totalDeferidos}</TableCell>
                                        <TableCell className="text-right">{totalGeral}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TabsContent>

                        <TabsContent value="grafico" className="m-0 p-4">
                            <div style={{ height: `${Math.max(350, (data?.length || 0) * 45)}px` }} className="w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data?.map(d => ({
                                            ...d,
                                            displayName: d.name.split(' ').slice(0, 2).join(' ')
                                        }))}
                                        layout="vertical"
                                        margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                        <XAxis
                                            type="number"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#888888"
                                        />
                                        <YAxis
                                            dataKey="displayName"
                                            type="category"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#888888"
                                            width={140}
                                            interval={0}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                border: '1px solid #333',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: '#fff'
                                            }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                        <Bar
                                            name="Exigências"
                                            dataKey="exigencia"
                                            stackId="a"
                                            fill={COLORS.exigencia}
                                            radius={[0, 0, 0, 0]}
                                            barSize={20}
                                        />
                                        <Bar
                                            name="Deferidos"
                                            dataKey="deferidos"
                                            stackId="a"
                                            fill={COLORS.deferidos}
                                            radius={[0, 4, 4, 0]}
                                            barSize={20}
                                        >
                                            <LabelList
                                                dataKey="total"
                                                position="right"
                                                style={{ fill: '#888888', fontSize: '10px', fontWeight: 'bold' }}
                                                offset={10}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Tabela Auxiliar (Exigências) */}
                <div className="lg:col-span-2 rounded-md border bg-card">
                    <div className="p-3 border-b bg-muted/40">
                        <h3 className="font-semibold text-sm">Detalhamento de Exigências</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8">Analista</TableHead>
                                <TableHead className="h-8 text-center">Esclarecer</TableHead>
                                <TableHead className="h-8 text-center">Respondidas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requirementsStats?.map((req, i) => (
                                <TableRow key={i} className="hover:bg-muted/50">
                                    <TableCell className="py-2 text-xs font-medium truncate">{req.analyst_name}</TableCell>
                                    <TableCell className="py-2 text-xs text-center text-yellow-600 font-semibold">{req.pending_clarification}</TableCell>
                                    <TableCell className="py-2 text-xs text-center text-blue-600">{req.answered}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Nova Seção: Tempo Médio por Analista */}
            {timeStats && timeStats.length > 0 && (
                <div className="rounded-md border bg-card">
                    <div className="p-3 border-b bg-muted/40">
                        <h3 className="font-semibold text-sm">Tempo Médio por Analista</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead className="h-8">Analista</TableHead>
                                <TableHead className="h-8 text-center">Tempo Médio Julgamento</TableHead>
                                <TableHead className="h-8 text-center">Tempo Médio Autenticação</TableHead>
                                <TableHead className="h-8 text-center">Tempo Médio Arquivamento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timeStats.map((timeStat, i) => (
                                <TableRow key={i} className="hover:bg-muted/50">
                                    <TableCell className="flex items-center gap-2 py-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-xs">{timeStat.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-xs">{timeStat.name}</span>
                                    </TableCell>
                                    <TableCell className="text-center text-xs py-2">{timeStat.avg_judgement_time || "-"}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{timeStat.avg_authentication_time || "-"}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{timeStat.avg_archiving_time || "-"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
