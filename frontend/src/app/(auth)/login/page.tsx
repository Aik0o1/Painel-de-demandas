"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle
} from "lucide-react";

const formSchema = z.object({
    email: z.string().email({
        message: "Informe um email válido.",
    }),
    password: z.string().min(6, {
        message: "A senha deve ter pelo menos 6 caracteres.",
    }),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                // NextAuth pode retornar a string de erro lançada no authorize()
                if (result.error.includes("análise") || result.error.includes("aprovação")) {
                    toast.error("Sua conta está em análise. Aguarde a liberação pelo administrador.");
                } else if (result.error.includes("rejeitada")) {
                    toast.error("Sua conta foi rejeitada pelo administrador.");
                } else if (result.error.includes("bloqueada")) {
                    toast.error("Sua conta está bloqueada.");
                } else {
                    toast.error("E-mail ou senha inválidos.");
                }
                return;
            }

            toast.success("Login realizado com sucesso!");
            router.push("/");
            router.refresh();
        } catch (error) {
            toast.error("Ocorreu um erro ao tentar fazer login.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full bg-background font-sans text-foreground overflow-x-hidden antialiased flex flex-col items-center justify-center p-6">
            <style jsx global>{`
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: hsl(var(--secondary) / 0.1); }
                ::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.5); border-radius: 2px; }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 bg-particles pointer-events-none">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
                        PAINEL DE DEMANDAS
                    </h1>
                    <p className="text-muted-foreground font-sans text-sm tracking-wide">
                        Entre com suas credenciais para acessar o sistema
                    </p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

                    {/* Email Input */}
                    <div className="input-group relative group">
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="email">
                            Email {errors.email && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.email.message}</span>}
                        </label>
                        <div className="flex items-center gap-4 py-2">
                            <Mail className="text-muted-foreground w-6 h-6 transition-all duration-300" style={{ animationDelay: '0s' }} />
                            <input
                                {...register("email")}
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground/50 focus:ring-0 px-0 text-lg font-medium tracking-wide outline-none w-full"
                                autoComplete="off"
                            />
                        </div>
                        <div className="h-[2px] w-full bg-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="input-group relative group mt-4">
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="password">
                            Senha {errors.password && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.password.message}</span>}
                        </label>
                        <div className="flex items-center gap-4 py-2">
                            <Lock className="text-muted-foreground w-6 h-6 transition-all duration-300" style={{ animationDelay: '0.5s' }} />
                            <input
                                {...register("password")}
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground/50 focus:ring-0 px-0 text-lg font-medium tracking-wide outline-none w-full"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="h-[2px] w-full bg-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 rounded-xl flex items-center justify-center gap-3 bg-primary text-primary-foreground font-bold tracking-widest uppercase transition-all active:scale-[0.98] group hover:bg-primary/90 hover:shadow-glow disabled:opacity-50 mt-4"
                    >
                        <span className="z-10 relative">{isLoading ? "Entrando..." : "Entrar"}</span>
                        {!isLoading && <ArrowRight className="z-10 relative group-hover:translate-x-1 transition-transform w-5 h-5" />}
                    </button>
                </form>

                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Não tem uma conta?{" "}
                        <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                            Crie agora
                        </Link>
                    </p>
                    <p className="text-xs text-muted-foreground/50">
                        &copy; 2026 painel de demandas.
                    </p>
                </div>
            </div>
        </div>
    );
}
