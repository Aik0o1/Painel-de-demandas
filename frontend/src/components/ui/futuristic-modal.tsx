
import React from 'react';
import { DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FuturisticModalProps {
    children: React.ReactNode;
    title: React.ReactNode;
    className?: string;
}

export function FuturisticModal({ children, title, className }: FuturisticModalProps) {
    return (
        <DialogContent className={cn("max-w-md w-full p-0 border-0 bg-transparent shadow-none sm:max-w-md overflow-hidden font-body", className)}>
            <div className="relative w-full">
                {/* Animated Background Blobs (Contained within Modal) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-5 mix-blend-overlay"></div>
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob"></div>
                    <div className="absolute top-1/2 -right-10 w-56 h-56 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-20 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 glass-panel w-full rounded-2xl p-6 md:p-8 transition-all duration-300">

                    <div className="flex justify-between items-start mb-8">
                        <div className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-foreground tracking-wide">
                            {title}
                        </div>
                        <DialogClose className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-muted-foreground">
                            <X className="w-6 h-6" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>

                    {children}
                </div>
            </div>
        </DialogContent>
    );
}

// Helper components for consistent inputs
interface FuturisticInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const FuturisticInput = React.forwardRef<HTMLInputElement, FuturisticInputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
                <div className="relative">
                    <input
                        ref={ref}
                        {...props}
                        className={cn(
                            "w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            className
                        )}
                    />
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
FuturisticInput.displayName = "FuturisticInput";

interface FuturisticSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export const FuturisticSelect = React.forwardRef<HTMLSelectElement, FuturisticSelectProps>(
    ({ label, error, options, placeholder, className, children, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
                <div className="relative">
                    <select
                        ref={ref}
                        {...props}
                        className={cn(
                            "appearance-none w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 cursor-pointer",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            className
                        )}
                    >
                        {placeholder && <option value="" disabled selected>{placeholder}</option>}
                        {children}
                        {options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {/* Standard arrow icon */}
                    <span className="absolute right-3 top-[50%] -translate-y-[50%] pointer-events-none text-gray-500 dark:text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lg w-5 h-5"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
FuturisticSelect.displayName = "FuturisticSelect";

interface FuturisticTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const FuturisticTextarea = React.forwardRef<HTMLTextAreaElement, FuturisticTextareaProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
                <div className="relative group">
                    <textarea
                        ref={ref}
                        {...props}
                        className={cn(
                            "w-full bg-gray-50 dark:bg-muted/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 resize-none",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            className
                        )}
                    />
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
FuturisticTextarea.displayName = "FuturisticTextarea";

interface FuturisticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function FuturisticButton({ children, isLoading, size = 'md', className, ...props }: FuturisticButtonProps) {
    const sizeClasses = {
        sm: "px-4 py-1.5 text-xs",
        md: "px-8 py-2.5 text-sm",
        lg: "px-10 py-3 text-base"
    };

    return (
        <button
            {...props}
            disabled={isLoading || props.disabled}
            className={cn(
                "group relative overflow-hidden rounded-lg bg-primary font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:pointer-events-none",
                sizeClasses[size],
                className
            )}
        >
            <span className="relative z-10 flex items-center gap-2 justify-center">
                {isLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>}
                {children}
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
    );
}
