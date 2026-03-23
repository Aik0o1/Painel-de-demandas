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
import { Copy, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { apiPost } from "@/services/api";

interface ResetPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: any;
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
    const [tempPassword, setTempPassword] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Simulate password generation

    // Simulate password generation
    const generatePassword = async () => {
        setIsLoading(true);
        try {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Removed special chars for simplicity/compatibility if needed, or keep them.
            // Using a simple set to avoid issues, but can include special if bcrypt/auth handles it (it should).
            const complexChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let password = "";
            for (let i = 0; i < 12; i++) {
                password += complexChars.charAt(Math.floor(Math.random() * complexChars.length));
            }

            await apiPost('/admin/users/reset-password', { userId: user.id, newPassword: password });

            setTempPassword(password);
            setShowResult(true);
            toast.success("Senha temporária gerada e atualizada com sucesso.");
        } catch (error: any) {
            console.error("Error resetting password:", error);
            // Error handling via global toast in apiPost
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tempPassword);
        toast.success("Senha copiada para a área de transferência");
    };

    const handleClose = () => {
        setShowResult(false);
        setTempPassword("");
        onOpenChange(false);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Resetar Senha</DialogTitle>
                    <DialogDescription>
                        Você está prestes a resetar a senha do usuário <strong>{user.full_name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {!showResult ? (
                    <div className="py-4 space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atenção</AlertTitle>
                            <AlertDescription>
                                Esta ação invalidará a senha atual. O usuário será forçado a criar uma nova senha no próximo login.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Nova Senha Temporária</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={tempPassword} className="font-mono bg-muted" />
                                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Compartilhe esta senha com o usuário de forma segura. Ela é visível apenas agora.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!showResult ? (
                        <Button variant="destructive" onClick={generatePassword}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Gerando...' : 'Gerar Nova Senha'}
                        </Button>
                    ) : (
                        <Button onClick={handleClose}>Concluir</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
