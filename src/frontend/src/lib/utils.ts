import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind CSS classes with clsx and tailwind-merge.
 * This is the gold standard for expert-level styling management.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
