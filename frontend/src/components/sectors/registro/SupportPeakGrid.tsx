import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Headset } from "lucide-react";

export function SupportPeakGrid({ supportStats, peakHours }: { supportStats: any[], peakHours: any[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Headset className="h-4 w-4" /> Atendimentos / Suporte
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Atendente</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead className="text-right">Qtd</TableHead>
                                <TableHead className="text-right">T.M.A</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supportStats?.map((s, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium text-xs">{s.attendant}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{s.channel}</TableCell>
                                    <TableCell className="text-right font-bold">{s.calls}</TableCell>
                                    <TableCell className="text-right text-xs">{s.avg_time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Horário de Pico de Protocolos</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={peakHours}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hour" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
