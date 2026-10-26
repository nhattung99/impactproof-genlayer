import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...values: ClassValue[]) => twMerge(clsx(values));
export const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;
