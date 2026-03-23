import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, FileUp, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIAnalysisDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AIAnalysisDialog({ open, onOpenChange }: AIAnalysisDialogProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = () => {
        setAnalyzing(true);
        // Simulate AI analysis delay
        setTimeout(() => {
            setResult({
                title: "Solicitação de Compra - Equipamentos TI",
                priority: "HIGH",
                dueDate: "2024-02-01",
                summary: "O documento solicita a aquisição de 5 notebooks e 2 monitores para o setor de desenvolvimento. Menciona urgência devido à contratação de novos estagiários.",
                riskScore: 15
            });
            setAnalyzing(false);
        }, 2000);
    };

    const handleReset = () => {
        setResult(null);
        setAnalyzing(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-500" />
                        Pré-análise com IA
                    </DialogTitle>
                    <DialogDescription>
                        Envie um documento (PDF) para que a IA extraia os dados principais.
                        <br />A IA não toma decisões, apenas sugere o preenchimento.
                    </DialogDescription>
                </DialogHeader>

                {!result && !analyzing && (
                    <div className="py-8 text-center border-2 border-dashed rounded-lg">
                        <FileUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <Button onClick={handleUpload}>Selecionar Arquivo PDF</Button>
                        <p className="text-xs text-muted-foreground mt-2">Máximo 10MB</p>
                    </div>
                )}

                {analyzing && (
                    <div className="py-12 text-center text-purple-600">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                        <p>Analisando documento...</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-4">
                        <Alert className="bg-purple-50 border-purple-200">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <AlertTitle>Análise Concluída</AlertTitle>
                            <AlertDescription>
                                Revise os dados extraídos abaixo antes de criar a demanda.
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Título Sugerido</Label>
                                <Input value={result.title} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Resumo</Label>
                                <div className="col-span-3 text-sm text-muted-foreground bg-muted p-2 rounded">
                                    {result.summary}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {result ? (
                        <>
                            <Button variant="ghost" onClick={handleReset}>Voltar</Button>
                            <Button onClick={() => onOpenChange(false)}>Confirmar e Criar</Button>
                        </>
                    ) : (
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
