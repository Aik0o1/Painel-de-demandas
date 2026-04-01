import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(amount)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function maskCurrency(value: string) {
  // Remove tudo que não é dígito
  let v = value.replace(/\D/g, "");
  
  // Converte para centavos
  const amount = (parseInt(v) || 0) / 100;
  
  // Formata como moeda, mas remove o R$ inicial se necessário para manter apenas o número formatado
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove pontos (milhar) e troca vírgula por ponto (decimal)
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}
