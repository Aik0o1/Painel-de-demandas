import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function ForgotPasswordDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="px-0 font-normal text-muted-foreground hover:text-primary">
                    Esqueceu sua senha?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recuperação de Acesso</DialogTitle>
                    <DialogDescription>
                        A recuperação de senha automática está desabilitada. Por favor, entre em contato com o administrador do sistema para redefinir sua senha.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => document.querySelector<HTMLElement>('[data-state="open"]')?.click()}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
