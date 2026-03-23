import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Info, Share, ArrowLeft, User } from "lucide-react";

interface AuditLogDetailsProps {
    log: any;
    onClose: () => void;
}

export function AuditLogDetails({ log, onClose }: AuditLogDetailsProps) {
    if (!log) return null;

    return (
        <div className="relative flex flex-col w-full h-[85vh] bg-background text-foreground font-sans overflow-hidden border border-border md:rounded-xl">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-[#0a0f12]/80 backdrop-blur-md p-4 justify-between border-b border-white/5">
                <button
                    onClick={onClose}
                    className="flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-white/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display">Detalhes do Log</h2>
                <div className="flex w-12 items-center justify-end">
                    <button className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-transparent text-white hover:bg-white/5 transition-colors">
                        <Share className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <main className="flex flex-col gap-6 p-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* Summary Header Card */}
                <section className="glass-panel p-5 rounded-xl shadow-2xl relative overflow-hidden border border-border bg-card shrink-0">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-orange-500/20 text-orange-500 border border-orange-500/40 shadow-[0_0_10px_rgba(255,140,0,0.4)] uppercase">
                            {log.action || "EVENT"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                <User className="h-6 w-6 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Usuário Responsável</p>
                                <p className="text-white text-lg font-bold tracking-tight break-all line-clamp-1">
                                    {log.userName || log.actor_name || 'Sistema'}
                                </p>
                                <p className="text-white/60 text-xs font-mono">{log.userEmail || log.actor_email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">Timestamp</p>
                                <p className="text-white text-sm font-semibold font-mono">
                                    {log.createdAt ? format(new Date(log.createdAt), "dd-MM-yyyy HH:mm:ss", { locale: ptBR }) : (log.created_at ? format(new Date(log.created_at), "dd-MM-yyyy HH:mm:ss", { locale: ptBR }) : '-')}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">Módulo</p>
                                <p className="text-white text-sm font-semibold font-mono truncate">{log.module || log.resource || 'UNKNOWN'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Description / Details */}
                {log.description && (
                    <section className="glass-panel p-4 rounded-xl border border-border bg-card">
                        <h3 className="text-cyan-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">Descrição</h3>
                        <p className="text-white text-sm">{log.description}</p>
                    </section>
                )}

                {/* Code Terminal Container */}
                <section className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-cyan-500 text-xs font-bold tracking-[0.2em] uppercase">Payload Audit Data</h3>
                        <span className="text-white/30 text-[10px] font-mono">JSON • UTF-8</span>
                    </div>
                    <div className="glass-panel rounded-xl border border-border shadow-inner overflow-hidden flex flex-col bg-background">
                        {/* Terminal Header Bar */}
                        <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <div className="flex gap-1.5">
                                <div className="size-2.5 rounded-full bg-[#ff5f56]"></div>
                                <div className="size-2.5 rounded-full bg-[#ffbd2e]"></div>
                                <div className="size-2.5 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <span className="text-white/40 text-[10px] font-mono ml-2">audit_log_{log._id?.slice(0, 4) || log.id?.slice(0, 4) || 'xxxx'}.json</span>
                        </div>
                        {/* Code Block */}
                        <div className="p-4 overflow-x-auto bg-[#0a0f12]">
                            <pre className="font-mono text-sm leading-relaxed text-gray-300">
                                <code>
                                    {JSON.stringify({
                                        event_id: log._id || log.id,
                                        action: log.action,
                                        module: log.module,
                                        timestamp: log.createdAt || log.created_at,
                                        origin_ip: log.ipAddress || log.ip_address,
                                        metadata: log.metadata,
                                        diff: log.details
                                    }, null, 2)}
                                </code>
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Metadata Details */}
                <section className="flex flex-col gap-3 shrink-0">
                    <div className="glass-panel rounded-xl border border-border px-4 py-3 bg-card">
                        <div className="flex items-center gap-3 mb-3">
                            <Info className="text-cyan-500 h-5 w-5" />
                            <p className="text-white text-sm font-medium">Informações Adicionais</p>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-white/50 text-xs">User Agent</span>
                                <span className="text-white text-xs font-mono truncate max-w-[250px]">{log.userAgent || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/50 text-xs">IP Address</span>
                                <span className="text-white text-xs font-mono">{log.ipAddress || log.ip_address}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <div className="absolute bottom-6 right-6">
                <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}
                    className="flex items-center gap-2 bg-[#0a0f12]/90 border border-cyan-500 text-cyan-500 rounded-full px-5 py-2.5 shadow-[0_0_20px_rgba(13,166,242,0.2)] hover:bg-cyan-500 hover:text-white transition-all active:scale-95"
                >
                    <Copy className="h-4 w-4" />
                    <span className="font-bold text-xs tracking-wide">COPY JSON</span>
                </button>
            </div>
        </div>
    );
}
