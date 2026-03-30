"use client";

import React, { useState, useEffect } from "react";
import { 
  ImageIcon, 
  FileSpreadsheet, 
  FileArchive, 
  FileCode, 
  File, 
  Clock, 
  UserIcon, 
  FolderSearch, 
  HardDrive,
  Download,
  AlertCircle,
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiGet, apiGetBlob, apiPost } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DirectoryInfo {
  name: string;
  count: number;
}

interface ReportFile {
  name: string;
  size: number;
  created_at: string;
  type: string;
}

export default function TiReportsPage() {
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchDirectories();
  }, []);

  useEffect(() => {
    if (selectedDir) {
      fetchFiles(selectedDir);
    }
  }, [selectedDir]);

  const fetchDirectories = async () => {
    setLoading(true);
    try {
      const data = await apiGet("it-reports/directories");
      setDirectories(data);
      if (data.length > 0) {
        setSelectedDir(data[0].name);
      }
    } catch (error) {
      console.error("Erro ao buscar diretórios:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (dirName: string) => {
    setLoadingFiles(true);
    try {
      const data = await apiGet(`it-reports/files/${dirName}`);
      setFiles(data);
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const generateReport = async (command: string, format: string) => {
    const promise = apiPost("it-reports/generate", { command, format });
    toast.promise(promise, {
      loading: "Gerando relatório...",
      success: (data) => {
        if (selectedDir) fetchFiles(selectedDir);
        return `Relatório ${data.filename} gerado com sucesso!`;
      },
      error: "Erro ao gerar relatório",
    });
  };

  const downloadFile = async (dirName: string, fileName: string) => {
    try {
      const blob = await apiGetBlob(`it-reports/download/${dirName}/${fileName}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast.error("Erro ao baixar o arquivo");
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return <File className="w-8 h-8 text-red-500" />;
      case "xlsx":
      case "csv": return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
      case "zip":
      case "gz": return <FileArchive className="w-8 h-8 text-yellow-500" />;
      case "log":
      case "txt": return <FileCode className="w-8 h-8 text-blue-400" />;
      default: return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || f.name.endsWith(filterType);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Search and Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Relatórios e Diagnósticos de TI
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Gestão automatizada de logs e estados do sistema linux
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => generateReport("df-h", "pdf")}>
            <Download className="w-4 h-4 mr-2" /> Gerar Espaço em Disco (PDF)
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => generateReport("lsblk", "xlsx")}>
            <Download className="w-4 h-4 mr-2" /> Gerar LSBLK (XLSX)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Sidebar Directories */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-md bg-slate-50/50 dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <>
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />)}
                </>
              ) : (
                directories.map(dir => (
                  <button
                    key={dir.name}
                    onClick={() => setSelectedDir(dir.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-200 group",
                      selectedDir === dir.name 
                        ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 font-semibold border border-blue-100 dark:border-blue-900/50" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-md transition-colors",
                        selectedDir === dir.name ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600"
                      )}>
                        <FolderSearch className="w-4 h-4" />
                      </div>
                      <span className="capitalize">{dir.name.replace(/_/g, ' ')}</span>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      selectedDir === dir.name ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : ""
                    )}>
                      {dir.count}
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 -m-4 opacity-10">
              <HardDrive className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              <CardDescription className="text-blue-100">Atualizar dados agora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-between" onClick={() => generateReport("last", "pdf")}>
                Last Logins <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-between" onClick={() => generateReport("uptime", "pdf")}>
                Uptime Stats <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Filtrar por nome..." 
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-blue-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="icon" 
                  className={cn("h-8 w-8", viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm" : "")}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="icon" 
                  className={cn("h-8 w-8", viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : "")}
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-1">
                <Button 
                  variant={filterType === "all" ? "outline" : "ghost"} 
                  size="sm" 
                  className="px-3"
                  onClick={() => setFilterType("all")}
                >
                  Tudo
                </Button>
                <Button 
                  variant={filterType === ".pdf" ? "outline" : "ghost"} 
                  size="sm" 
                  className="px-3"
                  onClick={() => setFilterType(".pdf")}
                >
                  PDF
                </Button>
                <Button 
                  variant={filterType === ".xlsx" ? "outline" : "ghost"} 
                  size="sm" 
                  className="px-3"
                  onClick={() => setFilterType(".xlsx")}
                >
                  XLSX
                </Button>
              </div>
            </div>
          </div>

          {/* Files Grid/List View */}
          {loadingFiles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <motion.div 
              layout
              className={cn(
                "grid gap-6",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file) => (
                  <motion.div
                    key={file.name}
                    layout 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "group hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden",
                      viewMode === "list" ? "flex flex-row items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" : ""
                    )}>
                      <div className={cn(
                        "relative flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10",
                        viewMode === "grid" ? "h-32 border-b dark:border-slate-800" : "p-4 rounded-xl border dark:border-slate-800 mr-4 shrink-0"
                      )}>
                        {getFileIcon(file.name)}
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 bg-white shadow-md dark:bg-slate-800"
                          onClick={() => downloadFile(selectedDir!, file.name)}
                        >
                          <Download className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                      
                      <div className={cn(
                        viewMode === "grid" ? "p-5" : "flex-1 min-w-0"
                      )}>
                        <h4 className="font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                            {format(new Date(file.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> 
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-600">Nenhum arquivo encontrado</p>
                <p className="text-sm text-slate-400 max-w-xs">
                  Não existem relatórios nesta categoria ou nenhum arquivo corresponde à sua busca.
                </p>
              </div>
              <Button variant="outline" onClick={() => generateReport("uptime", "pdf")}>
                Gerar Primeiro Relatório
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
