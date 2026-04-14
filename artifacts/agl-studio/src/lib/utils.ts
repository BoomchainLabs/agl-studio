import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: string | number): string {
  if (typeof num === "string") {
    const parsed = Number(num);
    if (isNaN(parsed)) return num;
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
