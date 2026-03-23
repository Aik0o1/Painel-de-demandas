"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, BarChart2, Cpu, Database, HardDrive, LayoutDashboard, MoreVertical, Zap } from "lucide-react";

import { useState } from 'react';

export default function AnalyticsPage() {
    const [viewMode, setViewMode] = useState<'live' | 'weekly'>('live');
    return (
        <DashboardLayout>
            <div className="min-h-screen bg-transparent font-sans text-foreground dark:text-slate-100 relative overflow-hidden">
                {/* Background Effects */}
                <div className="fixed inset-0 grid-pattern pointer-events-none opacity-40"></div>
                <div className="scanline"></div>

                <div className="fixed top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="fixed -bottom-20 -left-20 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="relative z-20 ">
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">Análises</h1>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">
                                Métricas detalhadas e indicadores de performance em tempo real. Processamento de dados via rede neural ativa.
                            </p>
                        </div>
                        <div className="hidden md:flex gap-4 items-center">
                            <div className="text-right">
                                <p className="text-xs font-mono text-primary/70 uppercase">Uptime Sistema</p>
                                <p className="text-xl font-mono font-bold text-primary">99.982%</p>
                            </div>
                            <div className="h-10 w-[1px] bg-muted"></div>
                            <div className="text-right">
                                <p className="text-xs font-mono text-emerald-500/70 uppercase">Latência Global</p>
                                <p className="text-xl font-mono font-bold text-emerald-500">14ms</p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Trend Chart Card */}
                        <div className="bg-card rounded-2xl p-8 relative overflow-hidden border border-border">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Tendência de Demandas</h2>
                                    <p className="text-sm text-slate-500 font-mono">PROTOCOLO: TEND-X_029</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('live')}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${viewMode === 'live' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-slate-700 hover:bg-muted/80'}`}
                                    >
                                        AO VIVO
                                    </button>
                                    <button
                                        onClick={() => setViewMode('weekly')}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${viewMode === 'weekly' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-slate-700 hover:bg-muted/80'}`}
                                    >
                                        SEMANAL
                                    </button>
                                </div>
                            </div>

                            <div className="chart-container h-64 w-full flex items-end justify-between px-4 relative">
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 200">
                                    <defs>
                                        <linearGradient id="gradient-line" x1="0%" x2="0%" y1="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.4)"></stop>
                                            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)"></stop>
                                        </linearGradient>
                                    </defs>
                                    <path
                                        className="transition-all duration-700 ease-in-out"
                                        d={viewMode === 'live'
                                            ? "M0,150 C40,140 60,180 100,160 C140,140 160,80 200,100 C240,120 260,170 300,140 C340,110 360,50 400,30 L400,200 L0,200 Z"
                                            : "M0,180 C60,170 100,140 160,150 C220,160 260,100 320,110 C360,120 380,60 400,80 L400,200 L0,200 Z"}
                                        fill="url(#gradient-line)"
                                    ></path>
                                    <path
                                        className="drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all duration-700 ease-in-out"
                                        d={viewMode === 'live'
                                            ? "M0,150 C40,140 60,180 100,160 C140,140 160,80 200,100 C240,120 260,170 300,140 C340,110 360,50 400,30"
                                            : "M0,180 C60,170 100,140 160,150 C220,160 260,100 320,110 C360,120 380,60 400,80"}
                                        fill="none" stroke="#0ea5e9" strokeWidth="3"
                                    ></path>
                                </svg>

                                {/* Data Points */}
                                {/* Data Points - Animated positions based on view mode */}
                                <div className={`absolute w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9] transition-all duration-700 ease-in-out ${viewMode === 'live' ? 'left-[25%] bottom-[20%]' : 'left-[25%] bottom-[25%]'}`}></div>
                                <div className={`absolute w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9] transition-all duration-700 ease-in-out ${viewMode === 'live' ? 'left-[50%] bottom-[50%]' : 'left-[50%] bottom-[30%]'}`}></div>
                                <div className={`absolute w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9] transition-all duration-700 ease-in-out ${viewMode === 'live' ? 'left-[75%] bottom-[30%]' : 'left-[75%] bottom-[55%]'}`}></div>
                                <div className={`absolute w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9] transition-all duration-700 ease-in-out ${viewMode === 'live' ? 'right-[2%] top-[15%]' : 'right-[2%] top-[60%]'}`}></div>
                            </div>

                            <div className="mt-6 flex justify-between text-xs font-mono text-slate-500 uppercase tracking-widest border-t border-slate-800 pt-4">
                                <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
                            </div>
                        </div>

                        {/* Budget Allocation Card */}
                        <div className="bg-card rounded-2xl p-8 relative overflow-hidden border border-border">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Orçamento por Setor</h2>
                                    <p className="text-sm text-slate-500 font-mono">ALOCACAO_ALOC_v4</p>
                                </div>
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle className="drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" cx="50" cy="50" fill="transparent" r="40" stroke="#0ea5e9" strokeDasharray="251.2" strokeDashoffset="100.48" strokeWidth="12"></circle>
                                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeDasharray="251.2" strokeDashoffset="200.96" strokeWidth="12"></circle>
                                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeDasharray="251.2" strokeDashoffset="238.64" strokeWidth="12"></circle>
                                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#a855f7" strokeDasharray="251.2" strokeDashoffset="251.2" strokeWidth="12"></circle>
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-xs font-mono text-slate-500 uppercase">Total</span>
                                        <span className="text-3xl font-bold font-mono tracking-tighter">R$ 2.4M</span>
                                    </div>
                                </div>

                                <div className="space-y-4 w-full md:w-48">
                                    {[
                                        { label: "Financeira", color: "bg-primary", glow: "shadow-[0_0_8px_rgba(34,211,238,0.4)]", percent: "60%" },
                                        { label: "Admin", color: "bg-emerald-500", glow: "", percent: "25%" },
                                        { label: "Comunicação", color: "bg-amber-500", glow: "", percent: "10%" },
                                        { label: "TI", color: "bg-purple-500", glow: "shadow-[0_0_8px_rgba(168,85,247,0.4)]", percent: "5%" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${item.color} ${item.glow}`}></div>
                                                <span className="text-sm font-semibold">{item.label}</span>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">{item.percent}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* System Stats Footer */}
                        <div className="xl:col-span-2 bg-card rounded-2xl p-4 flex flex-wrap gap-8 items-center justify-around border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500">CARGA_CPU</span>
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="w-[42%] h-full bg-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
                                </div>
                                <span className="text-xs font-mono text-primary">42%</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500">USO_MEM</span>
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="w-[78%] h-full bg-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
                                </div>
                                <span className="text-xs font-mono text-purple-500">78%</span>
                            </div>

                            <div className="hidden md:flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500">SINC_DADOS</span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                                <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider">ATIVO</span>
                            </div>

                            <div className="text-xs font-mono text-slate-500">
                                HASH: <span className="text-muted-foreground">0x882a...e911</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .grid-pattern {
                    background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .scanline {
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(to right, transparent, rgba(34, 211, 238, 0.2), transparent);
                    position: absolute;
                    animation: scan 4s linear infinite;
                    z-index: 10;
                    pointer-events: none;
                }
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </DashboardLayout>
    );
}
