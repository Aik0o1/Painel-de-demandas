import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';
import { apiPost } from '@/services/api';

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<string>("monthly");
    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return apiPost('/registry/upload', formData);
        },
        onSuccess: () => {
            toast.success('Arquivo importado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['registry-monthly'] });
            queryClient.invalidateQueries({ queryKey: ['registry-daily'] });
            onOpenChange(false);
            setFile(null);
        },
        onError: () => {
            toast.error('Erro ao processar arquivo.');
        }
    });

    const handleUpload = () => {
        if (!file) {
            toast.error('Selecione um arquivo.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        uploadMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Importar Dados</DialogTitle>
                    <DialogDescription>
                        Envie relatórios em Excel, CSV ou PDF para atualizar os dashboards.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Tipo de Relatório</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Fechamento Mensal (KPIs)</SelectItem>
                                <SelectItem value="daily">Produtividade Diária (Analistas)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Arquivo</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-4 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                    <p className="text-xs text-gray-500">Prioridade: .XLSX (Excel) ou .DOCX (Word)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </label>
                        </div>
                        {file && <p className="text-sm font-medium text-primary mt-2">Selecionado: {file.name}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                        {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Processar Importação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
