"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    FolderOpen,
    Folder,
    FileText,
    Upload,
    Search,
    Download,
    Trash2,
    Plus,
    X,
    ChevronRight,
    Home,
    Loader2,
    File as FileIcon,
    FolderPlus,
    ArrowLeft,
    Image as ImageIcon,
    FileSpreadsheet,
    FileArchive,
    FileCode,
    SearchCode as FolderSearch,
    Clock,
    User as UserIcon,
    HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost, apiDelete, apiGetBlob } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CONTAINER_VARIANTS = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const ITEM_VARIANTS = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Directory {
    id: string;
    name: string;
    parentId: string | null;
    createdBy: string | null;
    createdAt: string;
    fileCount: number;
}

interface ReportFile {
    id: string;
    name: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string | null;
    directoryId: string | null;
    uploadedBy: string | null;
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function humanSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <FileIcon className="w-6 h-6 text-slate-400" />;
    const m = mimeType.toLowerCase();
    if (m.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />;
    if (m.includes("image")) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (m.includes("sheet") || m.includes("excel") || m.includes("csv")) 
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
    if (m.includes("word") || m.includes("officedocument.word")) 
        return <FileText className="w-6 h-6 text-blue-600" />;
    if (m.includes("zip") || m.includes("compressed") || m.includes("rar")) 
        return <FileArchive className="w-6 h-6 text-amber-600" />;
    if (m.includes("javascript") || m.includes("json") || m.includes("html") || m.includes("css")) 
        return <FileCode className="w-6 h-6 text-purple-500" />;
    return <FileIcon className="w-6 h-6 text-slate-400" />;
}

function formatDate(iso: string): string {
    try {
        return format(new Date(iso), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (e) {
        return "-";
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TiReports() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Navigation state: null = root
    const [currentDirId, setCurrentDirId] = useState<string | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);

    // UI state
    const [search, setSearch] = useState("");
    const [isCreateDirOpen, setIsCreateDirOpen] = useState(false);
    const [newDirName, setNewDirName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "file" | "dir"; id: string; name: string } | null>(null);

    // ─── Queries ───────────────────────────────────────────────────────────────

    const { data: directories = [], isLoading: dirsLoading } = useQuery<Directory[]>({
        queryKey: ["it-report-directories"],
        queryFn: () => apiGet("/it-reports/directories"),
    });

    const { data: files = [], isLoading: filesLoading } = useQuery<ReportFile[]>({
        queryKey: ["it-report-files", currentDirId, search],
        queryFn: () => {
            const params = new URLSearchParams();
            if (currentDirId) params.set("directoryId", currentDirId);
            else params.set("directoryId", "root");
            if (search) params.set("search", search);
            return apiGet(`/it-reports/files?${params.toString()}`);
        },
    });

    // Children directories of current node
    const currentChildren = directories.filter((d) =>
        currentDirId === null ? d.parentId === null : d.parentId === currentDirId
    );

    // Filtered files (search is handled server-side, but also filter client-side for instant UX)
    const filteredFiles = search
        ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
        : files;

    // ─── Mutations ─────────────────────────────────────────────────────────────

    const createDirMutation = useMutation({
        mutationFn: (body: { name: string; parentId: string | null }) =>
            apiPost("/it-reports/directories", body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["it-report-directories"] });
            setIsCreateDirOpen(false);
            setNewDirName("");
            toast.success("Pasta criada com sucesso!");
        },
        onError: () => toast.error("Erro ao criar pasta."),
    });

    const deleteDirMutation = useMutation({
        mutationFn: (id: string) => apiDelete(`/it-reports/directories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["it-report-directories"] });
            queryClient.invalidateQueries({ queryKey: ["it-report-files"] });
            setDeleteTarget(null);
            toast.success("Pasta excluída com sucesso!");
        },
        onError: () => toast.error("Erro ao excluir pasta."),
    });

    const deleteFileMutation = useMutation({
        mutationFn: (id: string) => apiDelete(`/it-reports/files/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["it-report-files"] });
            setDeleteTarget(null);
            toast.success("Arquivo excluído com sucesso!");
        },
        onError: () => toast.error("Erro ao excluir arquivo."),
    });

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handleNavigate = (dir: Directory) => {
        setBreadcrumb((prev) => [...prev, { id: dir.id, name: dir.name }]);
        setCurrentDirId(dir.id);
        setSearch("");
    };

    const handleBreadcrumb = (index: number) => {
        if (index === -1) {
            setBreadcrumb([]);
            setCurrentDirId(null);
        } else {
            const target = breadcrumb[index];
            setBreadcrumb((prev) => prev.slice(0, index + 1));
            setCurrentDirId(target.id);
        }
        setSearch("");
    };

    const handleCreateDir = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDirName.trim()) return;
        createDirMutation.mutate({ name: newDirName.trim(), parentId: currentDirId });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);
        let successCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const formData = new FormData();
            formData.append("file", selectedFiles[i]);
            if (currentDirId) formData.append("directoryId", currentDirId);

            try {
                await apiPost("/it-reports/files/upload", formData);
                successCount++;
            } catch (err) {
                console.error(`Upload error for ${selectedFiles[i].name}:`, err);
                toast.error(`Erro no upload: ${selectedFiles[i].name}`);
            }
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (successCount > 0) {
            queryClient.invalidateQueries({ queryKey: ["it-report-files"] });
            toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
        }
    };

    const handleDownload = async (file: ReportFile) => {
        try {
            const blob = await apiGetBlob(`/it-reports/files/${file.id}/download`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Download error:", error);
            toast.error("Erro ao baixar arquivo.");
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    const isLoading = (dirsLoading && currentChildren.length === 0) || (filesLoading && filteredFiles.length === 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/10 p-6 md:p-10 shadow-2xl shadow-primary/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                                <HardDrive className="w-8 h-8 text-primary-foreground" />
                            </div>
                            Central de Relatórios
                        </h1>
                        <p className="text-muted-foreground mt-3 text-lg max-w-xl">
                            Gerencie, organize e acesse todos os relatórios estratégicos do setor de TI em um só lugar.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsCreateDirOpen(true)}
                            className="h-12 px-6 rounded-xl hover:scale-105 active:scale-95 transition-all gap-2 border-primary/10"
                        >
                            <FolderPlus className="w-5 h-5" />
                            Nova Pasta
                        </Button>

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2"
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isUploading ? "Enviando..." : "Enviar Arquivo"}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md bg-white/5">
                <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-1.5 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBreadcrumb(-1)}
                        className={`gap-1.5 rounded-lg px-3 ${!currentDirId ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"}`}
                    >
                        <Home className="w-4 h-4" />
                        <span className="font-medium">Raiz</span>
                    </Button>
                    
                    {breadcrumb.map((crumb, idx) => (
                        <div key={crumb.id} className="flex items-center gap-1.5">
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBreadcrumb(idx)}
                                className={`rounded-lg px-3 ${idx === breadcrumb.length - 1 ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {crumb.name}
                            </Button>
                        </div>
                    ))}
                </nav>

                <div className="relative w-full md:w-80 group px-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Buscar pastas ou arquivos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 w-full bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 transition-all shadow-inner"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                        <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-[spin_1s_linear_infinite]" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Indexando arquivos...</p>
                </div>
            ) : (
                <motion.div 
                    variants={CONTAINER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                    <div className="lg:col-span-4 lg:border-r lg:border-white/5 lg:pr-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-amber-500" />
                                Pastas
                                <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-500 border-none font-bold">
                                    {currentChildren.length}
                                </Badge>
                            </h2>
                        </div>

                        {currentChildren.length === 0 ? (
                            <div className="text-center py-10 rounded-2xl border border-dashed border-white/5 bg-white/5">
                                <p className="text-muted-foreground text-sm">Nenhuma subpasta</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {currentChildren.map((dir) => (
                                    <motion.div
                                        key={dir.id}
                                        variants={ITEM_VARIANTS}
                                        layout
                                        onClick={() => handleNavigate(dir)}
                                        className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-card/40 hover:bg-white/5 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-amber-950 transition-colors shadow-lg">
                                                <Folder className="w-6 h-6 fill-current" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground truncate group-hover:text-amber-500 transition-colors">{dir.name}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    {dir.fileCount || 0} arquivos
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget({ type: "dir", id: dir.id, name: dir.name });
                                            }}
                                            className="relative z-10 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Arquivos
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none font-bold">
                                    {filteredFiles.length}
                                </Badge>
                            </h2>
                        </div>

                        {filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-white/5 bg-white/5">
                                <div className="p-5 rounded-3xl bg-muted/20 mb-5 relative">
                                    <div className="absolute inset-0 animate-ping rounded-3xl bg-primary/5" />
                                    <FolderSearch className="w-12 h-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {search ? "Sem resultados" : "Pasta vazia"}
                                </h3>
                                <p className="text-muted-foreground mt-2 text-center max-w-xs">
                                    {search 
                                        ? "Tente buscar por outro termo ou navegue em outras pastas." 
                                        : "Esta pasta ainda não possui relatórios vinculados."}
                                </p>
                                {!search && (
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-6 rounded-xl h-11 px-6 shadow-xl"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Adicionar Relatório
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredFiles.map((file) => (
                                        <motion.div
                                            key={file.id}
                                            variants={ITEM_VARIANTS}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                            className="group flex flex-col p-5 rounded-2xl border border-white/5 bg-card/40 hover:bg-white/5 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] backdrop-blur-sm"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-primary/20 transition-colors shadow-inner">
                                                    {getFileIcon(file.mimeType)}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDownload(file)}
                                                        className="h-9 w-9 rounded-xl hover:bg-primary/20 text-primary shadow-sm"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget({ type: "file", id: file.id, name: file.name })}
                                                        className="h-9 w-9 rounded-xl hover:bg-destructive/20 text-destructive shadow-sm"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1 px-1">
                                                <h3 className="font-bold text-foreground truncate text-lg group-hover:text-primary transition-colors" title={file.name}>
                                                    {file.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                                                        <HardDrive className="w-3.5 h-3.5" />
                                                        {humanSize(file.fileSize)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDate(file.createdAt)}
                                                    </span>
                                                    {file.uploadedBy && (
                                                        <span className="flex items-center gap-1.5 text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded-md font-medium">
                                                            <UserIcon className="w-3.5 h-3.5" />
                                                            {file.uploadedBy}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}

            <Dialog open={isCreateDirOpen} onOpenChange={setIsCreateDirOpen}>
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border border-primary/20 rounded-[2rem] shadow-2xl overflow-hidden p-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <FolderPlus className="w-6 h-6" />
                            </div>
                            Criar Nova Pasta
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDir} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="dir-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
                                Nome da Identificação
                            </Label>
                            <Input
                                id="dir-name"
                                placeholder="P. ex. Relatórios Mensais 2024"
                                value={newDirName}
                                onChange={(e) => setNewDirName(e.target.value)}
                                autoFocus
                                className="h-14 bg-muted/30 border-primary/10 rounded-2xl text-lg px-6 focus-visible:ring-primary shadow-inner"
                            />
                        </div>
                        {breadcrumb.length > 0 && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Local de destino:</span>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    {breadcrumb[breadcrumb.length - 1].name}
                                </Badge>
                            </div>
                        )}
                        <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateDirOpen(false)} className="h-12 flex-1 rounded-xl">
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={!newDirName.trim() || createDirMutation.isPending}
                                className="h-12 flex-1 rounded-xl shadow-lg shadow-primary/20"
                            >
                                {createDirMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                                Criar Pasta
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border border-destructive/20 rounded-[2rem] shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-destructive">
                            <div className="p-2 rounded-xl bg-destructive/10">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            Confirmar Exclusão
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <p className="text-lg text-foreground/80 leading-relaxed">
                            Tem certeza que deseja excluir permanentemente o item selecionado?
                        </p>
                        <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-center gap-4">
                            {deleteTarget?.type === "dir" ? <Folder className="w-8 h-8 text-destructive/50" /> : <FileIcon className="w-8 h-8 text-destructive/50" />}
                            <span className="font-bold text-xl truncate">{deleteTarget?.name}</span>
                        </div>
                        {deleteTarget?.type === "dir" && (
                            <p className="text-xs text-destructive/80 font-medium bg-destructive/10 px-4 py-2 rounded-lg">
                                ⚠️ Atenção: Todos os arquivos e subpastas contidos nesta pasta serão removidos do sistema.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-3">
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="h-12 flex-1 rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (!deleteTarget) return;
                                if (deleteTarget.type === "dir") {
                                    deleteDirMutation.mutate(deleteTarget.id);
                                } else {
                                    deleteFileMutation.mutate(deleteTarget.id);
                                }
                            }}
                            className="h-12 flex-1 rounded-xl shadow-lg shadow-destructive/20"
                            disabled={deleteDirMutation.isPending || deleteFileMutation.isPending}
                        >
                            {(deleteDirMutation.isPending || deleteFileMutation.isPending) ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : null}
                            Confirmar Exclusão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
