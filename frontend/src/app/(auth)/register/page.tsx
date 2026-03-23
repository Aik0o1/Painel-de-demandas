"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    User,
    Mail,
    Shield,
    Briefcase,
    KeyRound,
    Lock,
    RotateCcw, // For lock_reset
    Eye,
    EyeOff,
    ChevronLeft,
    ArrowRight
} from "lucide-react";

// Helper for CPF masking
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
};

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter min. 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    cpf: z.string().min(14, { message: "CPF incompleto" }),
    position: z.string().min(1, { message: "Cargo é obrigatório" }),
    function: z.string().min(1, { message: "Função é obrigatória" }),
    password: z.string().min(6, { message: "Min. 6 caracteres" })
        .regex(/[A-Z]/, "Faltando letra maiúscula")
        .regex(/[a-z]/, "Faltando letra minúscula")
        .regex(/[0-9]/, "Faltando número")
        .regex(/[^A-Za-z0-9]/, "Faltando caractere especial"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            position: "",
            function: "",
        }
    });

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskCPF(e.target.value);
        setValue("cpf", masked, { shouldValidate: true });
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Erro ao criar conta.");
            }

            toast.success("Conta criada! Aguarde a liberação do seu acesso pelo administrador para fazer login.");
            router.push("/login");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden antialiased flex flex-col pb-24">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-secondary/10 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between p-6 pt-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-8 h-8" />
                </button>
            </header>

            {/* Title Section */}
            <div className="relative z-10 px-6 pb-8">
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                    CRIAR<br />
                    <span className="text-primary">CONTA</span>
                </h1>
                <p className="text-muted-foreground font-body text-sm tracking-wide">Preencha seus dados corporativos.</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 flex-1 flex flex-col gap-6 px-6">

                {/* Name Input */}
                <div className="input-group relative group">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="name">
                        Nome Completo {errors.name && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.name.message}</span>}
                    </label>
                    <div className="flex items-center gap-4 py-2">
                        <User className="text-muted-foreground w-6 h-6 transition-colors duration-300 group-focus-within:text-primary" />
                        <input
                            {...register("name")}
                            id="name"
                            placeholder="Ex: João Silva"
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-0 text-lg font-light tracking-wide outline-none w-full"
                            autoComplete="off"
                        />
                    </div>
                    <div className="h-[1px] w-full bg-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                    </div>
                </div>

                {/* Email Input */}
                <div className="input-group relative group">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="email">
                        Email {errors.email && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.email.message}</span>}
                    </label>
                    <div className="flex items-center gap-4 py-2">
                        <Mail className="text-muted-foreground w-6 h-6 transition-colors duration-300 group-focus-within:text-primary" />
                        <input
                            {...register("email")}
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-0 text-lg font-light tracking-wide outline-none w-full"
                            autoComplete="off"
                        />
                    </div>
                    <div className="h-[1px] w-full bg-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                    </div>
                </div>

                {/* CPF Input */}
                <div className="input-group relative group">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="cpf">
                        CPF {errors.cpf && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.cpf.message}</span>}
                    </label>
                    <div className="flex items-center gap-4 py-2">
                        <Shield className="text-muted-foreground w-6 h-6 transition-colors duration-300 group-focus-within:text-primary" />
                        <input
                            {...register("cpf")}
                            onChange={handleCPFChange}
                            id="cpf"
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-0 text-lg font-light tracking-wide outline-none w-full"
                            autoComplete="off"
                        />
                    </div>
                    <div className="h-[1px] w-full bg-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                    </div>
                </div>

                {/* Cargo & Função Row */}
                <div className="flex gap-6 flex-wrap md:flex-nowrap">
                    {/* Cargo Select */}
                    <div className="input-group relative group flex-1 min-w-[140px]">
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="cargo">
                            Cargo {errors.position && <span className="text-destructive ml-1">*</span>}
                        </label>
                        <div className="flex items-center gap-3 py-2">
                            <Briefcase className="text-muted-foreground w-5 h-5 transition-colors duration-300 group-focus-within:text-primary" />
                            <div className="relative w-full">
                                <select
                                    {...register("position")}
                                    className="w-full bg-transparent border-none text-foreground focus:ring-0 px-0 text-base font-light tracking-wide appearance-none cursor-pointer outline-none"
                                    id="cargo"
                                >
                                    <option className="bg-card text-muted-foreground" value="" disabled>Selecione</option>
                                    <option className="bg-card text-foreground" value="Analista">Analista</option>
                                    <option className="bg-card text-foreground" value="Gerente">Gerente</option>
                                    <option className="bg-card text-foreground" value="Diretor">Diretor</option>
                                    <option className="bg-card text-foreground" value="Coordenador">Coordenador</option>
                                    <option className="bg-card text-foreground" value="Assistente">Assistente</option>
                                    <option className="bg-card text-foreground" value="Estagiário">Estagiário</option>
                                    <option className="bg-card text-foreground" value="Desenvolvedor">Desenvolvedor</option>
                                    <option className="bg-card text-foreground" value="Designer">Designer</option>
                                    <option className="bg-card text-foreground" value="Gerente de Produto">Gerente de Produto</option>
                                </select>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                        </div>
                    </div>

                    {/* Função Select */}
                    <div className="input-group relative group flex-1 min-w-[140px]">
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="funcao">
                            Função {errors.function && <span className="text-destructive ml-1">*</span>}
                        </label>
                        <div className="flex items-center gap-3 py-2">
                            <KeyRound className="text-muted-foreground w-5 h-5 transition-colors duration-300 group-focus-within:text-primary" />
                            <div className="relative w-full">
                                <select
                                    {...register("function")}
                                    className="w-full bg-transparent border-none text-foreground focus:ring-0 px-0 text-base font-light tracking-wide appearance-none cursor-pointer outline-none"
                                    id="funcao"
                                >
                                    <option className="bg-card text-muted-foreground" value="" disabled>Selecione</option>
                                    <option className="bg-card text-foreground" value="Administrativo">Administrativo</option>
                                    <option className="bg-card text-foreground" value="Financeiro">Financeiro</option>
                                    <option className="bg-card text-foreground" value="Tecnologia">Tecnologia</option>
                                    <option className="bg-card text-foreground" value="Jurídico">Jurídico</option>
                                    <option className="bg-card text-foreground" value="Recursos Humanos">Recursos Humanos</option>
                                    <option className="bg-card text-foreground" value="Comunicação">Comunicação</option>
                                    <option className="bg-card text-foreground" value="Registro">Registro</option>
                                    <option className="bg-card text-foreground" value="Operacional">Operacional</option>
                                </select>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                        </div>
                    </div>
                </div>

                {/* Password Input */}
                <div className="input-group relative group mt-2">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="password">
                        Senha {errors.password && <span className="text-destructive ml-2 normal-case tracking-normal text-[10px]">{errors.password.message}</span>}
                    </label>
                    <div className="flex items-center gap-4 py-2">
                        <Lock className="text-muted-foreground w-6 h-6 transition-colors duration-300 group-focus-within:text-primary" />
                        <input
                            {...register("password")}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-0 text-lg font-light tracking-wide outline-none w-full"
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
                    <div className="h-[1px] w-full bg-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                    </div>
                </div>

                {/* Confirm Password Input */}
                <div className="input-group relative group">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1 group-focus-within:text-primary transition-colors" htmlFor="confirm_password">
                        Confirmar Senha {errors.confirmPassword && <span className="text-destructive ml-2 normal-case tracking-normal">{errors.confirmPassword.message}</span>}
                    </label>
                    <div className="flex items-center gap-4 py-2">
                        <RotateCcw className="text-muted-foreground w-6 h-6 transition-colors duration-300 group-focus-within:text-primary" />
                        <input
                            {...register("confirmPassword")}
                            id="confirm_password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-0 text-lg font-light tracking-wide outline-none w-full"
                            autoComplete="off"
                        />
                    </div>
                    <div className="h-[1px] w-full bg-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-0 bg-primary transition-all duration-500 ease-out group-focus-within:w-full"></div>
                    </div>
                </div>

                {/* Fixed Bottom Action Area */}
                <div className="fixed bottom-0 left-0 w-full p-6 pt-0 bg-gradient-to-t from-background via-background to-transparent z-20">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 rounded-xl flex items-center justify-center gap-3 bg-primary text-primary-foreground font-bold tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-50 shadow-md hover:shadow-primary/30"
                    >
                        <span className="z-10 relative">{isLoading ? "Criando..." : "Criar Conta"}</span>
                        {!isLoading && <ArrowRight className="z-10 relative transition-transform w-5 h-5 group-hover:translate-x-1" />}
                    </button>
                </div>

            </form>
        </div>
    );
}
